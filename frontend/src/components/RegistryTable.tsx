"use client";

import type { DossierRow } from "@/lib/fortress-data";
import { ThreatBadge } from "@/components/ThreatBadge";

function toneForPhase(phase: string) {
  if (phase.includes("TARGET")) return "yellow";
  if (phase.includes("IGNOR")) return "orange";
  if (phase.includes("ESCALAT")) return "red";
  if (phase.includes("WITNESS")) return "purple";
  if (phase.includes("CONSEQUENCES")) return "pink";
  return "red";
}

export function RegistryTable({ rows }: { rows: DossierRow[] }) {
  return (
    <div className="stone-brick-wall fortress-panel h-full overflow-hidden">
      <div className="border-b-4 border-border bg-[#7b7979] px-4 py-2">
        <div className="pixel-text text-center text-[0.9rem] text-[#161215]">LIST OF TARGETS</div>
      </div>
      <div className="grid grid-cols-[58px_1.15fr_1.6fr_1fr_0.8fr_1fr] border-b-4 border-border bg-[#2a252c] px-2 py-2">
        {["Icon", "Target Identity", "Grievance Entity", "Threat Phase", "Malice Quota", "Ritual"].map((label) => (
          <div key={label} className="pixel-text px-2 text-[0.6rem] text-muted">
            {label}
          </div>
        ))}
      </div>
      <div className="divide-y-4 divide-border">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[58px_1.15fr_1.6fr_1fr_0.8fr_1fr] items-center bg-[#221d24] px-2 py-2 hover:bg-[#362a34]"
          >
            <div className="px-2">
              <div className="flex h-9 w-9 items-center justify-center border-4 border-border bg-[#4b454d] pixel-text text-[0.7rem] text-text">
                {row.icon}
              </div>
            </div>
            <div className="px-2 font-mono text-[1.05rem] uppercase leading-tight text-text">{row.name}</div>
            <div className="px-2 font-mono text-[0.96rem] uppercase leading-tight text-muted">{row.entity}</div>
            <div className="px-2">
              <ThreatBadge label={row.phase} tone={toneForPhase(row.phase)} />
            </div>
            <div className="px-2 pixel-text text-[0.75rem] text-[#ffd39f]">{row.malice}</div>
            <div className="px-2 font-mono text-[0.95rem] uppercase text-fortress-pink">{row.ritual}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
