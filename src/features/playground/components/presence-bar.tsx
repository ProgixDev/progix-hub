"use client";

import { usePlaygroundStore } from "../provider";

/** Avatars of collaborators currently in the playground. */
export function PresenceBar() {
  const peers = usePlaygroundStore((s) => s.peers);
  if (peers.length === 0) return null;
  return (
    <div className="flex items-center -space-x-2" aria-label={`${peers.length} here`}>
      {peers.slice(0, 4).map((p) => (
        <span
          key={p.userId}
          title={p.name}
          className="bg-bg-2 ring-bg flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2"
          style={{ color: p.color, boxShadow: `inset 0 0 0 1.5px ${p.color}` }}
        >
          {p.initials}
        </span>
      ))}
      {peers.length > 4 && (
        <span className="bg-bg-3 text-text-2 ring-bg flex size-7 items-center justify-center rounded-full text-[10px] font-semibold ring-2">
          +{peers.length - 4}
        </span>
      )}
    </div>
  );
}
