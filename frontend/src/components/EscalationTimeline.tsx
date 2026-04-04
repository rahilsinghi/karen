"use client";

import { useCallback, useMemo, useState } from "react";
import { LevelCard, type ChannelInfo } from "./LevelCard";
import type { KarenEvent } from "@/lib/types";

interface EscalationTimelineProps {
  events: KarenEvent[];
  speed: string;
}

interface LevelState {
  level: number;
  channels: ChannelInfo[];
  overallStatus: "pending" | "active" | "complete" | "skipped" | "error";
}

const SPEED_SECONDS: Record<string, number> = {
  demo: 5,
  demo_10s: 10,
  quick: 600,
  standard: 3600,
  patient: 86400,
};

export function EscalationTimeline({ events, speed }: EscalationTimelineProps) {
  const levels = useMemo(() => {
    const map = new Map<number, LevelState>();

    for (const event of events) {
      if (event.type === "level_start") {
        let ls = map.get(event.level);
        if (!ls) {
          ls = { level: event.level, channels: [], overallStatus: "active" };
          map.set(event.level, ls);
        }
        if (!ls.channels.find((c) => c.channel === event.channel)) {
          ls.channels.push({
            channel: event.channel,
            messagePreview: event.message_preview,
            karenNote: null,
            status: "active",
          });
        }
        ls.overallStatus = "active";
      } else if (event.type === "level_complete") {
        const ls = map.get(event.level);
        if (ls) {
          const ch = ls.channels.find((c) => c.channel === event.channel);
          if (ch) {
            ch.status = "complete";
            ch.karenNote = event.karen_note;
          }
          const nonSkipped = ls.channels.filter(
            (c) => c.status !== "skipped"
          );
          if (
            nonSkipped.length > 0 &&
            nonSkipped.every((c) => c.status === "complete")
          ) {
            ls.overallStatus = "complete";
          }
        }
      } else if (event.type === "level_skipped") {
        let ls = map.get(event.level);
        if (!ls) {
          ls = { level: event.level, channels: [], overallStatus: "skipped" };
          map.set(event.level, ls);
        }
        ls.channels.push({
          channel: "skipped",
          messagePreview: event.reason,
          karenNote: null,
          status: "skipped",
        });
        if (ls.channels.every((c) => c.status === "skipped")) {
          ls.overallStatus = "skipped";
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.level - b.level);
  }, [events]);

  const lastActive = levels.findLast((l) => l.overallStatus === "active");

  const [manualExpanded, setManualExpanded] = useState<
    Record<string, boolean>
  >({});

  const isExpanded = useCallback(
    (ls: LevelState, index: number): boolean => {
      const key = `level-${ls.level}`;
      if (key in manualExpanded) return manualExpanded[key];
      if (ls.overallStatus === "active") return true;
      if (ls.overallStatus === "complete" && index === levels.length - 1)
        return true;
      return false;
    },
    [manualExpanded, levels]
  );

  const handleToggle = useCallback(
    (ls: LevelState, index: number) => {
      const key = `level-${ls.level}`;
      setManualExpanded((prev) => ({
        ...prev,
        [key]: !isExpanded(ls, index),
      }));
    },
    [isExpanded]
  );

  return (
    <div className="space-y-3">
      {levels.length === 0 && (
        <div className="border border-border rounded-sm p-6 text-center">
          <p className="font-mono text-sm text-muted">
            Waiting for Karen to begin...
          </p>
        </div>
      )}

      {levels.map((ls, i) => (
        <LevelCard
          key={`level-${ls.level}`}
          level={ls.level}
          channels={ls.channels}
          overallStatus={ls.overallStatus}
          nextLevelIn={
            ls === lastActive ? SPEED_SECONDS[speed] ?? 5 : undefined
          }
          expanded={isExpanded(ls, i)}
          onToggle={() => handleToggle(ls, i)}
        />
      ))}
    </div>
  );
}
