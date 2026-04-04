"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  prepare,
  layout,
  prepareWithSegments,
  layoutWithLines,
} from "@chenglou/pretext";
import type { KarenEvent } from "@/lib/types";

// ---------- constants ----------
const KAREN_FONT = '13px "DM Mono", monospace';
const LINE_HEIGHT = 20; // px
const BUBBLE_PADDING_X = 24; // 12px each side
const TYPEWRITER_LINE_DELAY_MS = 80;

// ---------- types ----------
interface CommentaryEntry {
  text: string;
  timestamp: string | undefined;
}

type LayoutLinesResult = ReturnType<typeof layoutWithLines>;
type LayoutLine = LayoutLinesResult["lines"][number];

interface BubbleMeasurement {
  tightWidth: number;
  lines: LayoutLine[];
  lineCount: number;
  height: number;
}

// ---------- shrinkwrap binary search ----------
// Given prepared text and a container width, binary-search for the tightest
// width that doesn't increase the line count beyond what the container would
// produce. This eliminates dead whitespace on the right side of chat bubbles.
function shrinkwrapWidth(
  prepared: ReturnType<typeof prepare>,
  containerWidth: number
): number {
  const baseResult = layout(prepared, containerWidth, LINE_HEIGHT);
  const targetLines = baseResult.lineCount;

  if (targetLines <= 1) {
    // Single line: use prepareWithSegments to get exact width
    // but we only have PreparedText here — fall back to binary search
    // with a tight lower bound.
    let lo = 0;
    let hi = containerWidth;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      const r = layout(prepared, mid, LINE_HEIGHT);
      if (r.lineCount <= targetLines) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    return hi;
  }

  // Multi-line: find the narrowest width that keeps the same line count.
  let lo = 0;
  let hi = containerWidth;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const r = layout(prepared, mid, LINE_HEIGHT);
    if (r.lineCount <= targetLines) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return hi;
}

// ---------- measure bubble ----------
function measureBubble(
  text: string,
  containerWidth: number
): BubbleMeasurement {
  const contentWidth = containerWidth - BUBBLE_PADDING_X;
  const prepared = prepare(text, KAREN_FONT);
  const tightContent = shrinkwrapWidth(prepared, contentWidth);
  const tightWidth = tightContent + BUBBLE_PADDING_X;

  // Get line data for typewriter
  const preparedSeg = prepareWithSegments(text, KAREN_FONT);
  const result = layoutWithLines(preparedSeg, tightContent, LINE_HEIGHT);

  return {
    tightWidth,
    lines: result.lines,
    lineCount: result.lineCount,
    height: result.height,
  };
}

// ---------- typewriter bubble ----------
interface TypewriterBubbleProps {
  text: string;
  timestamp: string | undefined;
  containerWidth: number;
  isNew: boolean;
}

function TypewriterBubble({
  text,
  timestamp,
  containerWidth,
  isNew,
}: TypewriterBubbleProps) {
  const [visibleLineCount, setVisibleLineCount] = useState(isNew ? 0 : Infinity);
  const [measurement, setMeasurement] = useState<BubbleMeasurement | null>(
    null
  );

  // Measure on mount / when text or container changes
  useEffect(() => {
    if (containerWidth <= 0) return;
    const m = measureBubble(text, containerWidth);
    setMeasurement(m);
  }, [text, containerWidth]);

  // Typewriter: reveal lines one by one
  useEffect(() => {
    if (!isNew || !measurement) return;
    if (visibleLineCount >= measurement.lineCount) return;

    // Start revealing from line 1
    if (visibleLineCount === 0) {
      setVisibleLineCount(1);
      return;
    }

    const timer = setTimeout(() => {
      setVisibleLineCount((c) => c + 1);
    }, TYPEWRITER_LINE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isNew, measurement, visibleLineCount]);

  if (!measurement) return null;

  const { tightWidth, lines, lineCount } = measurement;
  const showAll = visibleLineCount >= lineCount;
  const displayLines = showAll ? lines : lines.slice(0, visibleLineCount);

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-start gap-2"
    >
      <span className="text-sm mt-1.5 shrink-0 select-none">🦞</span>
      <div>
        <div
          className="border border-[#1e1e2e] rounded-sm px-3 py-2.5 relative overflow-hidden"
          style={{
            width: tightWidth,
            maxWidth: containerWidth - 32, // leave room for avatar + gap
            backgroundColor: "#12121a",
          }}
        >
          {/* Subtle amber left accent */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[2px]"
            style={{ backgroundColor: "#f59e0b", opacity: 0.4 }}
          />

          <div
            className="font-mono text-xs leading-[20px] text-[#f8f8ff]/80"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {displayLines.map((line, i) => (
              <span key={i}>
                {line.text}
                {i < displayLines.length - 1 ? "\n" : ""}
              </span>
            ))}
            {/* Blinking cursor during typewriter */}
            {isNew && !showAll && (
              <span className="inline-block w-[1px] h-3 bg-[#f59e0b] ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        </div>

        {/* Timestamp - only show after typewriter completes */}
        {timestamp && showAll && (
          <motion.p
            initial={isNew ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-mono text-[10px] text-[#6b6b8a] mt-1 ml-1"
          >
            {new Date(timestamp).toLocaleTimeString()}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

// ---------- main sidebar ----------
interface KarenSidebarProps {
  events: KarenEvent[];
}

export function KarenSidebar({ events }: KarenSidebarProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [seenCount, setSeenCount] = useState(0);

  const commentaries: CommentaryEntry[] = useMemo(() => {
    return events
      .filter((e) => e.type === "commentary" || e.type === "complete")
      .map((event) => ({
        text:
          event.type === "commentary"
            ? event.text
            : event.type === "complete"
              ? event.karen_closing
              : "",
        timestamp:
          event.type === "commentary" ? event.timestamp : undefined,
      }));
  }, [events]);

  // Track container width via ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mark entries that have already been seen (no typewriter for those)
  const markSeen = useCallback(() => {
    setSeenCount(commentaries.length);
  }, [commentaries.length]);

  useEffect(() => {
    // After a short delay, mark current entries as seen so future entries
    // get typewriter but re-renders of existing ones do not.
    const timer = setTimeout(markSeen, commentaries.length * TYPEWRITER_LINE_DELAY_MS * 4 + 500);
    return () => clearTimeout(timer);
  }, [commentaries.length, markSeen]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commentaries.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e2e]">
        <span className="text-2xl">🦞</span>
        <div>
          <h2 className="font-display font-semibold text-sm text-[#f8f8ff]">
            Karen&apos;s Commentary
          </h2>
          <p className="font-mono text-[10px] text-[#6b6b8a]">
            Internal monologue
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {commentaries.length === 0 && (
          <div className="flex items-center gap-2 py-8 justify-center">
            <span className="text-sm">🦞</span>
            <p className="font-mono text-xs text-[#6b6b8a] italic">
              Karen is preparing...
            </p>
          </div>
        )}

        {containerWidth > 0 &&
          commentaries.map((entry, i) => (
            <TypewriterBubble
              key={`${i}-${entry.text.slice(0, 20)}`}
              text={entry.text}
              timestamp={entry.timestamp}
              containerWidth={containerWidth}
              isNew={i >= seenCount}
            />
          ))}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#1e1e2e]">
        <p className="font-mono text-[9px] text-[#6b6b8a]/60 text-center">
          Karen is always watching. Karen means well.
        </p>
      </div>
    </div>
  );
}
