"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPlanStateAction } from "./actions";
import { usePlaygroundStore, usePlaygroundStoreApi } from "./provider";
import type { Peer, RemoteCursor } from "./types";

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
type PresenceMeta = {
  name?: string;
  initials?: string;
  color?: string;
  selectedId?: string | null;
};

/**
 * Live presence over a Supabase Realtime channel. Carries ONLY ephemeral signals — presence
 * (name/initials/color/selection), cursors, and a "plan changed" ping — never plan content.
 * On a ping, the actual plan is refetched through the RLS-gated server action, so nothing leaks.
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
  const store = usePlaygroundStoreApi();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const cursors = useRef<Map<string, RemoteCursor>>(new Map());
  const lastSent = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    const color = colorFor(me.id);
    const channel = supabase.channel(`playground:${projectId}`, {
      config: { presence: { key: me.id } },
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

    let dirtyTimer: ReturnType<typeof setTimeout> | null = null;

    channel
      .on("presence", { event: "sync" }, rebuildPeers)
      .on("presence", { event: "leave" }, rebuildPeers)
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        const c = payload as CursorPayload;
        if (c.userId === me.id) return;
        cursors.current.set(c.userId, c);
        setCursors([...cursors.current.values()]);
      })
      .on("broadcast", { event: "dirty" }, ({ payload }) => {
        if ((payload as { userId: string }).userId === me.id) return;
        if (dirtyTimer) clearTimeout(dirtyTimer);
        dirtyTimer = setTimeout(async () => {
          const state = await getPlanStateAction(projectId);
          if (state) syncPlan(state.items, state.links);
        }, 250);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.track({
            name: me.name,
            initials: me.initials,
            color,
            selectedId: store.getState().selectedId,
          });
        }
      });

    // Broadcast a "dirty" ping on local edits; re-track presence when the local selection changes.
    let lastRev = store.getState().localRev;
    let lastSel = store.getState().selectedId;
    const unsub = store.subscribe((state) => {
      if (state.localRev !== lastRev) {
        lastRev = state.localRev;
        void channel.send({ type: "broadcast", event: "dirty", payload: { userId: me.id } });
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
      if (dirtyTimer) clearTimeout(dirtyTimer);
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [projectId, me, store, setPeers, setCursors, syncPlan]);

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
  };
}
