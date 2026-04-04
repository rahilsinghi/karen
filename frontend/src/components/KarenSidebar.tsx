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
const KAREN_FONT = '16px "VT323", monospace';
const LINE_HEIGHT = 20; // px
const BUBBLE_PADDING_X = 24; // 12px each side
const TYPEWRITER_LINE_DELAY_MS = 60;

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
function shrinkwrapWidth(
  prepared: ReturnType<typeof prepare>,
  containerWidth: number
): number {
  const baseResult = layout(prepared, containerWidth, LINE_HEIGHT);
  const targetLines = baseResult.lineCount;

  if (targetLines <= 1) {
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

  useEffect(() => {
    if (containerWidth <= 0) return;
    const m = measureBubble(text, containerWidth);
    setMeasurement(m);
  }, [text, containerWidth]);

  useEffect(() => {
    if (!isNew || !measurement) return;
    if (visibleLineCount >= measurement.lineCount) return;

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
      <span className="text-xl mt-1 shrink-0 select-none drop-shadow-sm">👿</span>
      <div>
        <div
          className="pixel-border-obsidian px-3 py-2.5 relative overflow-hidden"
          style={{
            width: tightWidth,
            maxWidth: containerWidth - 32,
            backgroundColor: "#1a1a1a",
          }}
        >
          {/* Evil Redstone Accent */}
          <div
            className="absolute left-0 top-0 bottom-0 w-[4px]"
            style={{ backgroundColor: "#bb1a1a", opacity: 0.8 }}
          />

          <div
            className="font-mono text-lg leading-[20px] text-text/90 text-shadow-pixel"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {displayLines.map((line, i) => (
              <span key={i}>
                {line.text}
                {i < displayLines.length - 1 ? "\n" : ""}
              </span>
            ))}
            {isNew && !showAll && (
              <span className="inline-block w-[6px] h-4 bg-red-600 ml-0.5 animate-pulse align-middle" />
            )}
          </div>
        </div>

        {timestamp && showAll && (
          <motion.p
            initial={isNew ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-mono text-xs text-muted mt-1 ml-1"
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

  const markSeen = useCallback(() => {
    setSeenCount(commentaries.length);
  }, [commentaries.length]);

  useEffect(() => {
    const timer = setTimeout(markSeen, commentaries.length * TYPEWRITER_LINE_DELAY_MS * 4 + 500);
    return () => clearTimeout(timer);
  }, [commentaries.length, markSeen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [commentaries.length]);

  return (
    <div className="flex flex-col h-full bg-stone pixel-border-stone">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b-4 border-black bg-stone/50">
        <span className="text-3xl drop-shadow-md">💀</span>
        <div>
          <h2 className="font-display font-bold text-lg text-black uppercase tracking-wider text-shadow-pixel">
            THE ARSENAL
          </h2>
          <p className="font-mono text-xs text-black/70">
            Malice Monitoring System
          </p>
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-obsidian/30 ml-1 mr-1 mt-1 mb-1"
      >
        {commentaries.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 justify-center">
            <span className="text-4xl animate-bounce">👿</span>
            <p className="font-mono text-sm text-black/60 italic text-center">
              Karen is plotting her next move...
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
      <div className="px-4 py-3 border-t-4 border-black bg-stone/40">
        <p className="font-mono text-xs text-black font-bold text-center uppercase tracking-tighter">
          NO REMORSE. NO REFUNDS.
        </p>
      </div>
    </div>
  );
}
