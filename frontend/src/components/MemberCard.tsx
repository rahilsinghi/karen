"use client";

import Link from "next/link";
import type { Escalation, Member } from "@/lib/types";

export function MemberCard({ member, escalations }: { member: Member; escalations: Escalation[] }) {
  const active = escalations.find((item) => item.target.id === member.id && item.status === "active");

  return (
    <div className="fortress-panel p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="pixel-text text-[0.85rem] text-text">{member.name}</div>
          <div className="font-mono text-[1rem] uppercase text-muted">{member.role}</div>
        </div>
        <div className="pixel-text text-[1.2rem] text-fortress-pink">{member.avatar_emoji}</div>
      </div>
      <div className="mt-3 font-mono text-[1rem] uppercase text-text">
        {active ? `Level ${active.current_level} grievance live.` : "No live matter posted."}
      </div>
      <Link href="/trigger" className="mt-4 block border-4 border-border bg-[#5f2a82] px-3 py-3 pixel-text text-[0.7rem] text-text">
        Open Trigger Altar
      </Link>
    </div>
  );
}
