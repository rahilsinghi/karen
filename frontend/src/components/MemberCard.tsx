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
      .catch(() => {});
  }, [member.id]);

  const incoming = escalations.filter(
    (e) => e.target.id === member.id && e.status === "active"
  ).length;
  const outgoing = escalations.filter(
    (e) => e.initiator.id === member.id && e.status === "active"
  ).length;
  const lastResolved = escalations
    .filter((e) => e.target.id === member.id && e.status === "resolved")
    .sort(
      (a, b) =>
        new Date(b.resolved_at ?? 0).getTime() -
        new Date(a.resolved_at ?? 0).getTime()
    )[0];

  return (
    <div className="border border-border rounded-sm bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{member.avatar_emoji}</span>
        <div>
          <h3 className="font-display font-semibold text-lg leading-tight">
            {member.name}
          </h3>
          <span className="font-mono text-xs text-muted">{member.role}</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-muted mb-1.5">Can Karen reach them via:</p>
        <div className="flex gap-1.5 flex-wrap">
          {channels.map((ch) => (
            <span
              key={ch.channel}
              className={`text-sm ${ch.available ? "opacity-100" : "opacity-20"}`}
              title={`${ch.channel}${ch.available ? "" : " (unavailable)"}`}
            >
              {CHANNEL_ICONS[ch.channel] ?? "?"}
            </span>
          ))}
        </div>
      </div>

      <div className="font-mono text-xs text-muted space-y-0.5">
        <p>
          Active: {incoming} incoming · {outgoing} outgoing
        </p>
        {lastResolved && (
          <p>
            Last resolved:{" "}
            {new Date(lastResolved.resolved_at!).toLocaleDateString()}
          </p>
        )}
      </div>

      <Link
        href={`/trigger?target=${member.id}`}
        className="mt-auto border border-karen text-karen font-mono text-xs px-3 py-1.5 text-center hover:bg-karen/10 transition-colors"
      >
        Follow Up &rarr;
      </Link>
    </div>
  );
}
