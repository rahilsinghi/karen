"use client";

import { useCircle } from "@/hooks/useCircle";
import { ThreatBadge } from "@/components/ThreatBadge";
import type { Escalation } from "@/lib/types";

export function OpenMattersTable() {
  const { escalations } = useCircle();

  return (
    <div className="fortress-panel h-full overflow-hidden">
      <div className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] border-b-4 border-border bg-[#19141c] px-4 py-3">
        {["Target", "Grievance", "Level", "Status"].map((label) => (
          <div key={label} className="pixel-text px-2 text-[0.65rem] text-muted uppercase">
            {label}
          </div>
        ))}
      </div>
      <div className="divide-y-4 divide-border overflow-auto max-h-[600px]">
        {escalations.map((item: Escalation) => (
          <div key={item.id} className="grid grid-cols-[1fr_1.5fr_1fr_0.8fr] items-center bg-[#27212a]/90 px-4 py-4 hover:bg-[#362a34]">
            <div className="px-2 pixel-text text-[0.88rem] text-text whitespace-nowrap overflow-hidden text-ellipsis">
              {item.target.name}
            </div>
            <div className="px-2 font-mono text-[1rem] uppercase text-muted whitespace-nowrap overflow-hidden text-ellipsis">
              {item.grievance_detail}
            </div>
            <div className="px-2 pixel-text text-[0.85rem] text-fortress-pink">
              LVL {item.current_level}
            </div>
            <div className="px-2">
              <ThreatBadge
                label={item.status.toUpperCase()}
                tone={item.status === "resolved" ? "green" : item.current_level >= 8 ? "pink" : "orange"}
              />
            </div>
          </div>
        ))}
        {escalations.length === 0 && (
          <div className="p-8 text-center font-mono text-[1.1rem] uppercase text-muted">
            NO OPEN MATTERS REGISTERED
          </div>
        )}
      </div>
    </div>
  );
}
