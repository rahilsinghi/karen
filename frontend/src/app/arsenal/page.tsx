"use client";

import { useMemo, useState } from "react";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { ArsenalCard } from "@/components/ArsenalCard";
import { ArsenalDetailPanel } from "@/components/ArsenalDetailPanel";
import { artifactCategories, arsenalArtifacts } from "@/lib/fortress-data";

export default function ArsenalPage() {
  const [filter, setFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(arsenalArtifacts[0]?.id ?? "");

  const filtered = useMemo(
    () => arsenalArtifacts.filter((artifact) => filter === "ALL" || artifact.category === filter),
    [filter]
  );
  const selected = filtered.find((artifact) => artifact.id === selectedId) ?? filtered[0] ?? arsenalArtifacts[0];

  return (
    <FortressLayout
      title="ARSENAL // LOADOUT CHAMBER"
      subtitle="COMMAND CENTER OF MALICE"
      rightSidebar={<ArsenalDetailPanel artifact={selected} />}
      topStats={[
        { label: "ARSENAL POWER", value: "89%" },
        { label: "AVAILABLE RELICS", value: `${arsenalArtifacts.filter((item) => item.status !== "LOCKED").length}` },
        { label: "NUCLEAR TIER", value: `${arsenalArtifacts.filter((item) => item.status === "NUCLEAR").length}` },
      ]}
    >
      <div className="grid gap-6 p-2">
        <StonePanel title="FILTERS" eyebrow="RELIC CATEGORIES">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {artifactCategories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`border-4 border-border px-3 py-3 ${filter === category
                    ? "bg-[#5f2a82] shadow-[inset_4px_4px_0_rgba(255,255,255,0.1),inset_-4px_-4px_0_rgba(0,0,0,0.45)]"
                    : "bg-[#2c2631]"
                  }`}
              >
                <div className="pixel-text text-[0.65rem] text-text">{category}</div>
              </button>
            ))}
          </div>
        </StonePanel>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((artifact) => (
              <ArsenalCard
                key={artifact.id}
                artifact={artifact}
                active={artifact.id === selected?.id}
                onClick={() => setSelectedId(artifact.id)}
              />
            ))}
          </div>
          <OpenClawCoreCard status="ARMING" />
        </div>
      </div>
    </FortressLayout>
  );
}
