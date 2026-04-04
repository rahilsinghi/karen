"use client";

import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { loreSections } from "@/lib/fortress-data";

export default function KarenPage() {
  return (
    <FortressLayout
      title="KAREN LORE // CODEX ARCHIVE"
      subtitle="COMMAND CENTER OF MALICE"
      rightSidebar={<OpenClawCoreCard status="ENSHRINED" />}
    >
      <div className="grid gap-6">
        {loreSections.map((section) => (
          <StonePanel key={section.title} title={section.title} eyebrow="FORTRESS ARCHIVE">
            {section.title === "Escalation Arsenal v2" ? (
              <div className="grid gap-2 font-mono text-[1rem] uppercase">
                {section.body.split("\n").map((line, idx) => {
                  const level = idx + 1;
                  let colorClass = "text-level-green";
                  if (level >= 3) colorClass = "text-level-yellow";
                  if (level >= 5) colorClass = "text-level-orange";
                  if (level >= 7) colorClass = "text-level-red";
                  if (level === 9) colorClass = "text-level-purple";
                  if (level === 10) colorClass = "text-level-nuclear animate-pulse";

                  return (
                    <div key={idx} className={`${colorClass} flex items-center gap-2`}>
                      <span className="opacity-50">[{level}]</span> {line}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="font-mono text-[1.05rem] uppercase text-text leading-relaxed">{section.body}</div>
            )}
          </StonePanel>
        ))}
      </div>
    </FortressLayout>
  );
}
