"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CHANNEL_ICONS, API_URL } from "@/lib/constants";
import type { ChannelStatus, Escalation, Member } from "@/lib/types";

interface MemberCardProps {
  member: Member;
  escalations: Escalation[];
}

export function MemberCard({ member, escalations }: MemberCardProps) {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/members/${member.id}/channels`)
      .then((r) => r.json())
      .then(setChannels)
      .catch(() => { });
  }, [member.id]);

  const activeEscalations = escalations.filter(
    (e) => e.target.id === member.id && e.status === "active"
  );

  const isTargeted = activeEscalations.length > 0;
  const highestLevel = isTargeted
    ? Math.max(...activeEscalations.map(e => e.current_level))
    : 0;

  const statusLabel = isTargeted
    ? highestLevel >= 10 ? "NUCLEAR" : "TARGETED"
    : "IDLE";

  const statusColorClass = isTargeted
    ? highestLevel >= 10 ? "text-level-nuclear animate-pulse" : "text-red-500"
    : "text-green-500 opacity-50";

  return (
    <div className="pixel-border-obsidian bg-obsidian p-5 flex flex-col gap-4 hover:brightness-110 transition-all group">
      <div className="flex items-center justify-between border-b-2 border-black/50 pb-2">
        <div className="flex items-center gap-3">
          <span className="text-4xl drop-shadow-md group-hover:scale-110 transition-transform">
            {member.avatar_emoji}
          </span>
          <div>
            <h3 className="font-display font-bold text-xl leading-tight text-white uppercase tracking-tighter">
              {member.name}
            </h3>
            <span className="font-mono text-sm text-stone-500 uppercase">
              {member.role}
            </span>
          </div>
        </div>
        <div className={`font-display text-xs font-bold px-2 py-1 border-2 border-black bg-black/40 ${statusColorClass}`}>
          {statusLabel}
        </div>
      </div>

      <div className="bg-black/20 p-2 pixel-border-stone">
        <p className="font-mono text-[10px] text-stone-400 mb-2 uppercase tracking-widest">
          Attack Vectors:
        </p>
        <div className="flex gap-2 flex-wrap">
          {channels.map((ch) => (
            <span
              key={ch.channel}
              className={`text-xl ${ch.available ? "grayscale-0" : "grayscale opacity-10"}`}
              title={`${ch.channel}${ch.available ? "" : " (unavailable)"}`}
            >
              {CHANNEL_ICONS[ch.channel] ?? "?"}
            </span>
          ))}
        </div>
      </div>

      <div className="font-mono text-sm text-stone-300 space-y-1">
        <p className="flex justify-between">
          <span>MALICE LEVEL:</span>
          <span className={isTargeted ? "text-red-500" : "text-green-500"}>
            {highestLevel}/10
          </span>
        </p>
      </div>

      <Link
        href={`/trigger?target=${member.id}`}
        className="mt-auto pixel-border-stone bg-stone text-black font-display font-bold text-sm px-4 py-3 text-center hover:bg-red-600 hover:text-white transition-colors uppercase tracking-widest active:translate-y-1 shadow-[0_4px_0_0_#000] active:shadow-none"
      >
        UNLEASH KAREN
      </Link>
    </div>
  );
}
