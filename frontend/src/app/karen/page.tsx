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
      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        {loreSections.map((section) => (
          <StonePanel key={section.title} title={section.title} eyebrow="FORTRESS ARCHIVE">
            <div className="font-mono text-[1.05rem] uppercase text-text">{section.body}</div>
          </StonePanel>
        ))}
      </div>
    </FortressLayout>
  );
}
