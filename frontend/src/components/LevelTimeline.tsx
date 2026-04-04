"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LevelCard } from "@/components/LevelCard";
import type { KarenEvent } from "@/lib/types";
import { CHANNEL_ICONS, LEVEL_LABELS } from "@/lib/constants";

interface LevelTimelineProps {
    events: KarenEvent[];
    currentLevel: number;
}

export function LevelTimeline({ events, currentLevel }: LevelTimelineProps) {
    const [progress, setProgress] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Extract interlude timing from events
    const interlude = useMemo(() => {
        for (let i = events.length - 1; i >= 0; i--) {
            const e = events[i];
            if (e.type === "interlude_start") {
                return { level: e.level, duration: e.duration_seconds, startedAt: Date.now() };
            }
        }
        return null;
    }, [events]);

    // Run countdown timer based on interlude events
    useEffect(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        if (!interlude) {
            setProgress(0);
            setRemainingSeconds(0);
            return;
        }

        const { duration, startedAt } = interlude;

        const tick = () => {
            const elapsed = (Date.now() - startedAt) / 1000;
            const pct = Math.min(100, (elapsed / duration) * 100);
            const remaining = Math.max(0, Math.ceil(duration - elapsed));
            setProgress(pct);
            setRemainingSeconds(remaining);

            if (elapsed >= duration && timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };

        tick();
        timerRef.current = setInterval(tick, 100);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [interlude]);

    const levelData = useMemo(() => {
        const levels: Record<number, {
            level: number;
            channel: string;
            emoji: string;
            label: string;
            messagePreview?: string;
            karenNote?: string;
            status: string;
        }> = {};

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

    const interludeLevel = interlude?.level ?? 0;

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
                    progress={level.level === interludeLevel && level.status === "COMPLETE" ? progress : level.status === "COMPLETE" ? 100 : 0}
                    remainingSeconds={level.level === interludeLevel ? remainingSeconds : undefined}
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
