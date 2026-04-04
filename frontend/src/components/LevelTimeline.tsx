"use client";

import { useMemo } from "react";
import { LevelCard } from "@/components/LevelCard";
import type { KarenEvent } from "@/lib/types";
import { CHANNEL_ICONS, LEVEL_LABELS } from "@/lib/constants";

interface LevelTimelineProps {
    events: KarenEvent[];
    currentLevel: number;
}

export function LevelTimeline({ events, currentLevel }: LevelTimelineProps) {
    const levelData = useMemo(() => {
        const levels: Record<number, any> = {};

        events.forEach((event) => {
            if (event.type === "level_start") {
                levels[event.level] = {
                    ...levels[event.level],
                    level: event.level,
                    channel: event.channel,
                    emoji: CHANNEL_ICONS[event.channel.toLowerCase()] || "💀",
                    label: LEVEL_LABELS[event.level] || "Escalation",
                    messagePreview: event.message_preview,
                    status: "ACTIVE",
                };
            }
            if (event.type === "level_complete") {
                levels[event.level] = {
                    ...levels[event.level],
                    level: event.level,
                    channel: event.channel,
                    karenNote: event.karen_note,
                    status: "COMPLETE",
                };
            }
        });

        return Object.values(levels).sort((a, b) => b.level - a.level);
    }, [events]);

    return (
        <div className="space-y-4">
            <div className="text-[0.65rem] text-muted uppercase tracking-widest mb-2 px-1">
                Mission Log // Historical Record
            </div>
            {levelData.map((level) => (
                <LevelCard
                    key={level.level}
                    {...level}
                    isCurrent={level.level === currentLevel && level.status !== "COMPLETE"}
                    progress={level.level === currentLevel ? 65 : 100} // Mock progress for now, would need actual timer logic
                />
            ))}
            {levelData.length === 0 && (
                <div className="p-8 text-center font-mono text-xs text-muted border-2 border-dashed border-stone-800">
                    WAITING FOR MISSION START...
                </div>
            )}
        </div>
    );
}
