"use client";

import { StonePanel } from "@/components/StonePanel";
import { RitualButton } from "@/components/RitualButton";
import { PixelStatBar } from "@/components/PixelStatBar";
import type { ArsenalArtifact } from "@/lib/fortress-data";

export function ArsenalDetailPanel({ artifact }: { artifact: ArsenalArtifact }) {
  return (
    <StonePanel title="LOADOUT DETAIL" eyebrow="WEAPONS ROOM">
      <div className="space-y-4">
        <div className="fortress-panel p-4">
          <div className="pixel-text text-[1.2rem] text-fortress-pink">
            {artifact.icon} {artifact.name}
          </div>
          <div className="mt-2 font-mono text-[1rem] uppercase text-muted">{artifact.tier} {"//"} Linked Level {artifact.level}</div>
          <p className="mt-3 font-mono text-[1rem] uppercase text-text">{artifact.mechanics}</p>
        </div>
        <PixelStatBar label="COOLDOWN" value={artifact.status === "CHARGING" ? 64 : artifact.status === "LOCKED" ? 12 : 93} />
        <PixelStatBar label="CHAOS YIELD" value={artifact.level * 9} color="#ff4fd8" />
        <div className="fortress-panel p-4">
          <div className="pixel-text text-[0.6rem] text-muted">PREVIEW ANIMATION</div>
          <div className="mt-3 flex h-28 items-center justify-center border-4 border-border bg-[#180f18]">
            <div className="threat-shake pixel-text text-[1rem] text-fortress-ember">{artifact.icon} FIRING TEST SIGIL {artifact.icon}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <RitualButton label="TEST FIRE" subtitle="DRY RUN VOLLEY" variant="arcane" />
          <RitualButton label="EQUIP TO RITUAL" subtitle="ARM THE SLOT" variant="primary" />
        </div>
      </div>
    </StonePanel>
  );
}
