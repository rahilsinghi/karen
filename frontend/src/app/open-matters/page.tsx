"use client";

import { useMemo } from "react";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { OpenMattersTable } from "@/components/OpenMattersTable";
import { KAREN_QUOTES } from "@/lib/constants";
import { useCircle } from "@/hooks/useCircle";

export default function OpenMattersPage() {
  const { escalations } = useCircle();

  const quote = useMemo(() => KAREN_QUOTES[Math.floor(Date.now() / 8000) % KAREN_QUOTES.length], []);

  const stats = useMemo(() => {
    const active = escalations.filter((e) => e.status === "active").length;
    const resolved = escalations.filter((e) => e.status === "resolved").length;
    return [
      { label: "TOTAL MATTERS", value: `${escalations.length}` },
      { label: "ACTIVE", value: `${active}` },
      { label: "RESOLVED", value: `${resolved}` },
      { label: "CURRENTLY ESCAPING KAREN", value: "0" },
    ];
  }, [escalations]);

  return (
    <FortressLayout
      title="OPEN MATTERS // CURSED LEDGER WALL"
      subtitle="COMMAND CENTER OF MALICE"
      rightSidebar={<OpenClawCoreCard status="OBSERVING" />}
    >
      <div className="grid gap-4">
        {/* Rotating quote */}
        <StonePanel title="KAREN SPEAKS" eyebrow="ROTATING QUOTE">
          <div className="pixel-text text-[0.82rem] text-fortress-pink">{quote}</div>
        </StonePanel>

        {/* Stats row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="fortress-panel p-3">
              <div className="pixel-text text-[0.55rem] text-muted">{s.label}</div>
              <div className="pixel-text text-[1.2rem] text-text">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Full table */}
        <OpenMattersTable />
      </div>
    </FortressLayout>
  );
}
