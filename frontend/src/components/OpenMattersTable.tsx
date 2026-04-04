"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { prepare, layout } from "@chenglou/pretext";
import type { Escalation } from "@/lib/types";
import { API_URL, getLevelColorClass, KAREN_QUOTES } from "@/lib/constants";

// ─── Constants ────────────────────────────────────────────────────────
const OVERSCAN_PX = 200;
const ROW_PADDING_Y = 24;
const ROW_BORDER = 1;
const ROW_FONT = "18px VT323, monospace";
const HEADER_HEIGHT = 44;

// ─── Types ────────────────────────────────────────────────────────────
interface RowMetrics {
  y: number;
  height: number;
}

interface OpenMattersTableProps {
  escalations: Escalation[];
}

// ─── StatusBadge ──────────────────────────────────────────────────────
function StatusBadge({ escalation }: { escalation: Escalation }) {
  const { status, current_level } = escalation;

  if (status === "resolved") {
    return (
      <span className="font-mono text-sm px-2 py-0.5 border-2 border-green-900 text-green-500 bg-black/40 pixel-border-stone uppercase font-bold">
        ELIMINATED
      </span>
    );
  }
  if (current_level >= 8) {
    return (
      <span className="font-mono text-sm px-2 py-0.5 border-2 border-red-900 text-red-500 bg-black/40 pixel-border-stone animate-pulse uppercase font-bold text-shadow-pixel">
        REDSTONE OVERLOAD
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        className={`font-mono text-sm px-2 py-0.5 border-2 bg-black/40 pixel-border-stone uppercase font-bold ${getLevelColorClass(current_level)}`}
      >
        ENGAGED L{current_level}
      </span>
    );
  }
  return (
    <span className="font-mono text-sm px-2 py-0.5 border-2 border-stone-800 text-stone-500 bg-black/40 pixel-border-stone uppercase font-bold">
      STALKING
    </span>
  );
}

// ─── Tooltip on hover ─────────────────────────────────────────────────
function RowTooltip({
  escalation,
  onQuickEscalate,
}: {
  escalation: Escalation;
  onQuickEscalate: (id: string) => void;
}) {
  if (escalation.status === "resolved") return null;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
      <div className="bg-stone-900 pixel-border-stone px-6 py-4 shadow-2xl whitespace-nowrap">
        <p className="font-mono text-sm text-stone-400 mb-3 uppercase font-bold">
          FURTHER ESCALATION REQUIRED?
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => onQuickEscalate(escalation.id)}
            className="font-mono text-sm px-4 py-2 bg-red-800 text-white hover:bg-red-700 transition-colors pixel-border-stone uppercase font-bold"
          >
            EXECUTE
          </button>
          <button
            onClick={() => onQuickEscalate(escalation.id)}
            className="font-mono text-sm px-4 py-2 bg-stone-800 text-stone-500 hover:bg-stone-700 transition-colors pixel-border-stone uppercase font-bold"
          >
            NEVER STOP
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pre-compute row metrics using pretext ─────────────────────────────
function computeRowMetrics(
  escalations: Escalation[],
  containerWidth: number
): RowMetrics[] {
  if (escalations.length === 0 || containerWidth === 0) return [];

  const detailColWidth = Math.max(containerWidth * 0.34 - 32, 80);
  const lineHeight = 20;
  const metrics: RowMetrics[] = [];
  let currentY = 0;

  for (const esc of escalations) {
    const text = esc.grievance_detail || "---";

    let contentHeight = lineHeight;
    try {
      const prepared = prepare(text, ROW_FONT);
      const result = layout(prepared, detailColWidth, lineHeight);
      contentHeight = Math.max(result.height, lineHeight);
    } catch {
      const charsPerLine = Math.max(Math.floor(detailColWidth / 9), 1);
      const lines = Math.ceil(text.length / charsPerLine);
      contentHeight = lines * lineHeight;
    }

    const rowHeight = contentHeight + ROW_PADDING_Y + ROW_BORDER;
    metrics.push({ y: currentY, height: rowHeight });
    currentY += rowHeight;
  }

  return metrics;
}

// ─── Virtual row renderer ─────────────────────────────────────────────
function VirtualRow({
  escalation,
  metrics,
  onQuickEscalate,
}: {
  escalation: Escalation;
  metrics: RowMetrics;
  onQuickEscalate: (id: string) => void;
}) {
  const isResolved = escalation.status === "resolved";

  return (
    <div
      className={`group absolute left-0 right-0 border-b-2 border-stone-900 hover:bg-stone-800/30 transition-colors ${isResolved ? "line-through opacity-40 grayscale" : ""
        }`}
      style={{
        top: metrics.y,
        height: metrics.height,
      }}
    >
      <div className="relative grid grid-cols-[8%_18%_10%_34%_10%_20%] items-center h-full">
        {/* Ref */}
        <div className="font-mono text-sm px-4 text-stone-600 font-bold uppercase">
          #{escalation.id.slice(0, 6)}
        </div>
        {/* Name */}
        <div className="font-mono text-lg px-4 text-white uppercase font-bold tracking-tight">
          {escalation.target.name}
        </div>
        {/* Amount */}
        <div className="font-mono text-lg px-4 text-red-500 font-bold">
          {escalation.amount ? `$${escalation.amount}` : "---"}
        </div>
        {/* Detail */}
        <div className="font-mono text-sm px-4 text-stone-400 break-words font-bold uppercase leading-tight">
          {escalation.grievance_detail}
        </div>
        {/* Level */}
        <div className="font-mono text-lg px-4 font-bold">
          <span className={getLevelColorClass(escalation.current_level)}>
            {escalation.current_level}/{escalation.max_level}
          </span>
        </div>
        {/* Status */}
        <div className="px-4">
          <StatusBadge escalation={escalation} />
        </div>

        <RowTooltip
          escalation={escalation}
          onQuickEscalate={onQuickEscalate}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────
export function OpenMattersTable({ escalations }: OpenMattersTableProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % KAREN_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewportHeight(el.clientHeight);
    const onScroll = () => setScrollTop(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  const rowMetrics = useMemo(
    () => computeRowMetrics(escalations, containerWidth),
    [escalations, containerWidth]
  );

  const totalHeight = useMemo(() => {
    if (rowMetrics.length === 0) return 0;
    const last = rowMetrics[rowMetrics.length - 1];
    return last.y + last.height;
  }, [rowMetrics]);

  const visibleRange = useMemo(() => {
    if (rowMetrics.length === 0) return { start: 0, end: 0 };
    const top = Math.max(0, scrollTop - OVERSCAN_PX);
    const bottom = scrollTop + viewportHeight + OVERSCAN_PX;
    let lo = 0;
    let hi = rowMetrics.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (rowMetrics[mid].y + rowMetrics[mid].height < top) lo = mid + 1;
      else hi = mid;
    }
    const start = lo;
    lo = start;
    hi = rowMetrics.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (rowMetrics[mid].y > bottom) hi = mid - 1;
      else lo = mid;
    }
    return { start, end: lo + 1 };
  }, [rowMetrics, scrollTop, viewportHeight]);

  const onQuickEscalate = useCallback(
    async (id: string) => {
      const esc = escalations.find((e) => e.id === id);
      if (!esc) return;
      try {
        const res = await fetch(`${API_URL}/api/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initiator_id: esc.initiator.id,
            target_id: esc.target.id,
            grievance_type: esc.grievance_type,
            grievance_detail: esc.grievance_detail,
            amount: esc.amount ?? undefined,
            personality: esc.personality,
            speed: "demo",
            max_level: 1,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          window.location.href = `/escalation/${data.id}`;
        }
      } catch { }
    },
    [escalations]
  );

  const totalMatters = escalations.length;
  const totalOutstanding = escalations
    .filter((e) => e.status !== "resolved")
    .reduce((sum, e) => sum + (e.amount ?? 0), 0);
  const resolved = escalations.filter((e) => e.status === "resolved");
  const avgDays =
    resolved.length > 0
      ? Math.round(
        resolved.reduce((sum, e) => {
          const start = new Date(e.started_at).getTime();
          const end = new Date(e.resolved_at ?? e.started_at).getTime();
          return sum + (end - start) / 86400000;
        }, 0) / resolved.length
      )
      : 0;

  const visibleEscalations = escalations.slice(visibleRange.start, visibleRange.end);
  const visibleMetrics = rowMetrics.slice(visibleRange.start, visibleRange.end);

  return (
    <div ref={containerRef}>
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "LOGGED GRIEVANCES", value: totalMatters },
          { label: "UNCLAIMED BOUNTIES", value: `$${totalOutstanding}` },
          { label: "AVG ELIMINATION", value: `${avgDays}D` },
          { label: "EVADING KAREN", value: "0" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="pixel-border-obsidian bg-obsidian p-6 shadow-xl"
          >
            <p className="font-mono text-sm text-stone-500 uppercase font-bold tracking-tight mb-1">
              {label}
            </p>
            <p className="font-display text-4xl font-bold uppercase tracking-tighter text-white text-shadow-pixel">{value}</p>
          </div>
        ))}
      </div>

      {/* Rotating quote */}
      <p className="font-mono text-xl text-red-600/80 text-center mb-8 h-6 transition-opacity duration-500 uppercase font-bold italic tracking-tighter">
        &ldquo;{KAREN_QUOTES[quoteIndex].toUpperCase()}&rdquo;
      </p>

      {/* Masonry virtual-scrolled table */}
      <div className="pixel-border-obsidian bg-obsidian overflow-hidden shadow-2xl">
        {/* Sticky column headers */}
        <div
          className="grid grid-cols-[8%_18%_10%_34%_10%_20%] border-b-4 border-black bg-stone-900"
          style={{ height: HEADER_HEIGHT }}
        >
          {["ID", "TARGET", "BOUNTY", "GRIEVANCE", "PHASE", "STATUS"].map((h) => (
            <div
              key={h}
              className="font-mono text-sm text-stone-500 uppercase font-bold tracking-tight text-left px-4 flex items-center"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Scrollable virtual viewport */}
        <div
          ref={scrollRef}
          className="overflow-y-auto custom-scrollbar"
          style={{ maxHeight: "70vh" }}
        >
          {escalations.length === 0 ? (
            <div className="px-4 py-12 text-center font-mono text-xl text-stone-600 uppercase font-bold">
              THE LOGS ARE EMPTY. KAREN IS HUNGRY. FOR NOW.
            </div>
          ) : (
            <div className="relative" style={{ height: totalHeight }}>
              {visibleEscalations.map((esc, i) => (
                <VirtualRow
                  key={esc.id}
                  escalation={esc}
                  metrics={visibleMetrics[i]}
                  onQuickEscalate={onQuickEscalate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
