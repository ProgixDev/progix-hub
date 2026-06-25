"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePlaygroundStore, usePlaygroundStoreApi } from "./provider";
import type { Peer, PlanItem, PlanLink, PlanStroke, RemoteCursor } from "./types";

const COLORS = [
  "#4c82fb",
  "#3fb97f",
  "#e0a53b",
  "#f0613b",
  "#a78bfa",
  "#38bdf8",
  "#fb7185",
  "#34d399",
];
function colorFor(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

type CursorPayload = { userId: string; name: string; color: string; x: number; y: number };
type DragPayload = { userId: string; id: string; x: number; y: number };
type SyncPayload = { userId: string; items: PlanItem[]; links: PlanLink[] };
type StrokePayload = { userId: string; stroke: PlanStroke };
type ClearPayload = { userId: string };
type PresenceMeta = {
  name?: string;
  initials?: string;
  color?: string;
  selectedId?: string | null;
};

/**
 * Live collaboration over a Supabase Realtime channel. The channel is PRIVATE (RLS-gated to project
 * members, migration 0031), so it carries the real changes: presence, cursors, live drags, and the
 * full plan state on every local edit — applied to peers instantly (no refetch round-trip).
 */
export function usePlaygroundPresence({
  projectId,
  me,
}: {
  projectId: string;
  me: { id: string; name: string; initials: string };
}) {
  const setPeers = usePlaygroundStore((s) => s.setPeers);
  const setCursors = usePlaygroundStore((s) => s.setCursors);
  const syncPlan = usePlaygroundStore((s) => s.syncPlan);
  const syncPatch = usePlaygroundStore((s) => s.syncPatch);
  const addStroke = usePlaygroundStore((s) => s.addStroke);
  const clearStrokes = usePlaygroundStore((s) => s.clearStrokes);
  const store = usePlaygroundStoreApi();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursors = useRef<Map<string, RemoteCursor>>(new Map());
  const lastSent = useRef(0);
  const lastDrag = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    const color = colorFor(me.id);
    // Private channel — gated to project members by RLS on realtime.messages (migration 0031).
    const channel = supabase.channel(`playground:${projectId}`, {
      config: { private: true, presence: { key: me.id } },
    });
    channelRef.current = channel;

    function rebuildPeers() {
      const state = channel.presenceState<PresenceMeta>();
      const peers: Peer[] = [];
      const present = new Set<string>();
      for (const key of Object.keys(state)) {
        present.add(key);
        if (key === me.id) continue;
        const meta = (state[key]?.[0] ?? {}) as PresenceMeta;
        peers.push({
          userId: key,
          name: meta.name ?? "Member",
          initials: meta.initials ?? "?",
          color: meta.color ?? "#4c82fb",
          selectedId: meta.selectedId ?? null,
        });
      }
      setPeers(peers);
      for (const id of [...cursors.current.keys()]) {
        if (!present.has(id)) cursors.current.delete(id);
      }
      setCursors([...cursors.current.values()]);
    }

    channel
      .on("presence", { event: "sync" }, rebuildPeers)
      .on("presence", { event: "leave" }, rebuildPeers)
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        const c = payload as CursorPayload;
        if (c.userId === me.id) return;
        cursors.current.set(c.userId, c);
        setCursors([...cursors.current.values()]);
      })
      .on("broadcast", { event: "drag" }, ({ payload }) => {
        const d = payload as DragPayload;
        if (d.userId === me.id) return;
        syncPatch(d.id, { pos_x: d.x, pos_y: d.y });
      })
      .on("broadcast", { event: "sync" }, ({ payload }) => {
        const s = payload as SyncPayload;
        if (s.userId === me.id) return;
        syncPlan(s.items, s.links);
      })
      .on("broadcast", { event: "stroke" }, ({ payload }) => {
        const s = payload as StrokePayload;
        if (s.userId === me.id) return;
        addStroke(s.stroke);
      })
      .on("broadcast", { event: "clearstrokes" }, ({ payload }) => {
        if ((payload as ClearPayload).userId === me.id) return;
        clearStrokes();
      });

    // Private channels require the auth token on the realtime socket for both read AND write
    // (presence/broadcast). Set it from the session, then subscribe.
    void supabase.auth.getSession().then(({ data }) => {
      supabase.realtime.setAuth(data.session?.access_token);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({
            name: me.name,
            initials: me.initials,
            color,
            selectedId: store.getState().selectedId,
          });
        }
      });
    });

    // On a local edit, broadcast the full plan state (coalesced) so peers apply it instantly — and
    // re-track presence when the local selection changes.
    let lastRev = store.getState().localRev;
    let lastSel = store.getState().selectedId;
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    const unsub = store.subscribe((state) => {
      if (state.localRev !== lastRev) {
        lastRev = state.localRev;
        if (!syncTimer) {
          syncTimer = setTimeout(() => {
            syncTimer = null;
            const st = store.getState();
            void channel.send({
              type: "broadcast",
              event: "sync",
              payload: { userId: me.id, items: st.items, links: st.links } satisfies SyncPayload,
            });
          }, 50);
        }
      }
      if (state.selectedId !== lastSel) {
        lastSel = state.selectedId;
        void channel.track({
          name: me.name,
          initials: me.initials,
          color,
          selectedId: state.selectedId,
        });
      }
    });

    return () => {
      unsub();
      if (syncTimer) clearTimeout(syncTimer);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId, me, store, setPeers, setCursors, syncPlan, syncPatch, addStroke, clearStrokes]);

  return {
    broadcastCursor(x: number, y: number) {
      const now = Date.now();
      if (now - lastSent.current < 45) return;
      lastSent.current = now;
      const color = colorFor(me.id);
      void channelRef.current?.send({
        type: "broadcast",
        event: "cursor",
        payload: { userId: me.id, name: me.name, color, x, y } satisfies CursorPayload,
      });
    },
    /** Live card position during a drag, so peers watch it move (throttled). */
    broadcastDrag(id: string, x: number, y: number) {
      const now = Date.now();
      if (now - lastDrag.current < 45) return;
      lastDrag.current = now;
      void channelRef.current?.send({
        type: "broadcast",
        event: "drag",
        payload: { userId: me.id, id, x, y } satisfies DragPayload,
      });
    },
    /** A committed sketch stroke, so peers see it appear. */
    broadcastStroke(stroke: PlanStroke) {
      void channelRef.current?.send({
        type: "broadcast",
        event: "stroke",
        payload: { userId: me.id, stroke } satisfies StrokePayload,
      });
    },
    /** The drawing was cleared. */
    broadcastClear() {
      void channelRef.current?.send({
        type: "broadcast",
        event: "clearstrokes",
        payload: { userId: me.id } satisfies ClearPayload,
      });
    },
  };
}
