"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { ThreatBadge } from "@/components/ThreatBadge";
import { KAREN_QUOTES } from "@/lib/constants";
import { useCircle } from "@/hooks/useCircle";

export default function OpenMattersPage() {
  const { escalations } = useCircle();

  const quote = useMemo(() => KAREN_QUOTES[escalations.length % KAREN_QUOTES.length], [escalations.length]);

  return (
    <FortressLayout
      title="OPEN MATTERS // CURSED LEDGER WALL"
      subtitle="COMMAND CENTER OF MALICE"
      rightSidebar={<OpenClawCoreCard status="OBSERVING" />}
    >
      <div className="grid gap-4">
        <StonePanel title="ROTATING QUOTE STRIP" eyebrow="KAREN SPEAKS">
          <div className="pixel-text text-[0.82rem] text-fortress-pink">{quote}</div>
        </StonePanel>
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {escalations.map((escalation) => (
            <Link key={escalation.id} href={`/escalation/${escalation.id}`}>
              <div className="fortress-panel h-full p-4 hover:bg-[#3b2d37]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="pixel-text text-[0.88rem] text-text">{escalation.target.name}</div>
                    <div className="mt-2 font-mono text-[1rem] uppercase text-muted">{escalation.grievance_detail}</div>
                  </div>
                  <ThreatBadge
                    label={escalation.status.toUpperCase()}
                    tone={escalation.status === "resolved" ? "green" : escalation.current_level >= 9 ? "pink" : escalation.current_level >= 7 ? "red" : "orange"}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between font-mono text-[1rem] uppercase">
                  <span>Level {escalation.current_level}</span>
                  <span>{escalation.channels_used.length} channels</span>
                </div>
              </div>
            </Link>
          ))}
          {escalations.length === 0 && (
            <StonePanel title="NO ACTIVE LEDGERS" eyebrow="BOUNTY BOARD">
              <div className="font-mono text-[1rem] uppercase text-text">
                No matters are posted. The wall hungers for a fresh grievance.
              </div>
            </StonePanel>
          )}
        </div>
      </div>
    </FortressLayout>
  );
}
