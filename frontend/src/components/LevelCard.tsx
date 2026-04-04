"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { prepare, layout } from "@chenglou/pretext";
import {
  CHANNEL_ICONS,
  getLevelBgClass,
  getLevelColorClass,
} from "@/lib/constants";

const MONO_FONT = '14px "DM Mono", monospace';
const MONO_FONT_XS = '12px "DM Mono", monospace';

export interface ChannelInfo {
  channel: string;
  messagePreview: string;
  karenNote: string | null;
  status: "pending" | "active" | "complete" | "skipped" | "error";
}

function predictExpandedHeight(
  channels: ChannelInfo[],
  containerWidth: number,
  hasProgressBar: boolean
): number {
  const active = channels.filter((c) => c.status !== "skipped");
  if (active.length === 0) return 68;

  const headerHeight = 36;
  const headerBottomMargin = 8;
  const msgPadding = 32;
  const msgMaxWidth = containerWidth - msgPadding;
  const msgLineHeight = 22;

  let contentHeight = 0;

  for (const ch of active) {
    // Channel label (only when multiple active channels)
    if (active.length > 1) {
      contentHeight += 24;
    }

    // Message height via pretext
    if (ch.messagePreview && msgMaxWidth > 0) {
      try {
        const prepared = prepare(ch.messagePreview, MONO_FONT);
        const result = layout(prepared, msgMaxWidth, msgLineHeight);
        contentHeight += result.height;
      } catch {
        const cpl = Math.max(1, Math.floor(msgMaxWidth / 8.4));
        contentHeight +=
          Math.ceil(ch.messagePreview.length / cpl) * msgLineHeight;
      }
    }
    contentHeight += 8;
  }

  // Karen's note from first channel that has one
  const note = active.find((c) => c.karenNote)?.karenNote;
  let noteHeight = 0;
  if (note) {
    const noteText = `Karen\u2019s note: \u201C${note}\u201D`;
    const noteMax = containerWidth - msgPadding;
    if (noteMax > 0) {
      try {
        const prepared = prepare(noteText, MONO_FONT_XS);
        const result = layout(prepared, noteMax, 18);
        noteHeight = result.height;
      } catch {
        const cpl = Math.max(1, Math.floor(noteMax / 7.2));
        noteHeight = Math.ceil(noteText.length / cpl) * 18;
      }
    }
  }

  const progressHeight = hasProgressBar ? 34 : 0;
  const verticalPadding = 32;

  return (
    headerHeight +
    headerBottomMargin +
    contentHeight +
    noteHeight +
    progressHeight +
    verticalPadding
  );
}

interface LevelCardProps {
  level: number;
  channels: ChannelInfo[];
  overallStatus: "pending" | "active" | "complete" | "skipped" | "error";
  nextLevelIn?: number;
  expanded: boolean;
  onToggle: () => void;
}

export function LevelCard({
  level,
  channels,
  overallStatus,
  nextLevelIn,
  expanded,
  onToggle,
}: LevelCardProps) {
  const colorClass = getLevelColorClass(level);
  const bgClass = getLevelBgClass(level);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(400);

  const activeChannels = useMemo(
    () => channels.filter((c) => c.status !== "skipped"),
    [channels]
  );

  const channelIcons = useMemo(
    () => activeChannels.map((c) => CHANNEL_ICONS[c.channel] ?? "\u{1F4E8}"),
    [activeChannels]
  );

  const primaryNote = useMemo(
    () => activeChannels.find((c) => c.karenNote)?.karenNote ?? null,
    [activeChannels]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(
          entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width
        );
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasProgressBar =
    overallStatus === "active" && nextLevelIn != null && nextLevelIn > 0;

  const predictedHeight = useMemo(
    () => predictExpandedHeight(channels, containerWidth, hasProgressBar),
    [channels, containerWidth, hasProgressBar]
  );

  const collapsedHeight = 68;

  const statusLabel = overallStatus.toUpperCase();
  const statusBorderColor =
    overallStatus === "complete"
      ? "border-level-green/40 text-level-green"
      : overallStatus === "active"
        ? "border-karen/40 text-karen"
        : overallStatus === "error"
          ? "border-level-red/40 text-level-red"
          : overallStatus === "skipped"
            ? "border-muted/40 text-muted"
            : "border-border text-muted";

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`border rounded-sm overflow-hidden ${bgClass}${level === 9 ? " glow-purple" : ""}${level >= 10 ? " glow-nuclear" : ""}`}
    >
      <div
        style={{
          height: expanded ? `${predictedHeight}px` : `${collapsedHeight}px`,
          transition: "height 280ms cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        <div className="p-4">
          {/* Header */}
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`font-display font-bold whitespace-nowrap ${colorClass}`}
              >
                Level {level}
              </span>
              <span className="text-sm text-muted">&middot;</span>
              {channelIcons.map((icon, i) => (
                <span key={i} className="text-sm">
                  {icon}
                </span>
              ))}
              <span className="text-xs uppercase font-mono text-muted whitespace-nowrap truncate">
                {activeChannels.map((c) => c.channel).join(" + ")}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${statusBorderColor}`}
              >
                {statusLabel}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="text-muted transition-transform duration-200"
                style={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path
                  d="M3 5L7 9L11 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>

          {/* Expanded content */}
          <div
            className="mt-2"
            style={{
              opacity: expanded ? 1 : 0,
              transition: "opacity 200ms ease",
              pointerEvents: expanded ? "auto" : "none",
            }}
          >
            {activeChannels.map((ch, i) => (
              <div key={ch.channel} className={i > 0 ? "mt-2" : ""}>
                {activeChannels.length > 1 && (
                  <p className="font-mono text-xs text-muted mb-1">
                    {CHANNEL_ICONS[ch.channel] ?? "\u{1F4E8}"} {ch.channel}
                  </p>
                )}
                <p className="font-mono text-sm text-text/80 leading-relaxed">
                  {ch.messagePreview}
                </p>
              </div>
            ))}

            {primaryNote && (
              <p className="font-mono text-xs text-muted italic mt-2">
                Karen&apos;s note: &ldquo;{primaryNote}&rdquo;
              </p>
            )}

            {hasProgressBar && (
              <div className="mt-3">
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-karen"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: nextLevelIn,
                      ease: "linear",
                    }}
                  />
                </div>
                <p className="font-mono text-[10px] text-muted mt-1">
                  Next level in{" "}
                  {nextLevelIn! < 60
                    ? `${nextLevelIn}s`
                    : nextLevelIn! < 3600
                      ? `${Math.round(nextLevelIn! / 60)}m`
                      : `${Math.round(nextLevelIn! / 3600)}h`}
                  ...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
