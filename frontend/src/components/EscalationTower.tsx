"use client";

import { LEVEL_LABELS } from "@/lib/constants";
import { LevelChamberCard } from "@/components/LevelChamberCard";
import { StonePanel } from "@/components/StonePanel";

export function EscalationTower({ currentLevel }: { currentLevel: number }) {
    const levels = Object.entries(LEVEL_LABELS)
        .map(([level, label]) => ({ level: Number(level), label }))
        .reverse();

    return (
        <StonePanel title="ESCALATION TOWER" eyebrow="BOSS FIGHT LADDER" className="h-full">
            <div className="relative space-y-3">
                <div className="wire-run animate-wire-pulse absolute bottom-0 left-7 top-0 w-2" />
                {levels.map((entry) => (
                    <LevelChamberCard
                        key={entry.level}
                        level={entry.level}
                        label={entry.label}
                        active={entry.level === currentLevel}
                        complete={entry.level < currentLevel}
                    />
                ))}
            </div>
        </StonePanel>
    );
}
