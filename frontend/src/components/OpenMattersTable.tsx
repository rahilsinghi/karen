"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { prepare, layout } from "@chenglou/pretext";
import type { Escalation } from "@/lib/types";
import { API_URL, getLevelColorClass, KAREN_QUOTES } from "@/lib/constants";

// ─── Constants ────────────────────────────────────────────────────────
const OVERSCAN_PX = 200;
const ROW_PADDING_Y = 24; // py-3 = 12px top + 12px bottom
const ROW_BORDER = 1;
const ROW_FONT = "12px DM Mono, monospace";
const HEADER_HEIGHT = 36;

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
      <span className="font-mono text-xs px-2 py-0.5 border border-level-green/40 text-level-green rounded-sm">
        RESOLVED
      </span>
    );
  }
  if (current_level >= 8) {
    return (
      <span className="font-mono text-xs px-2 py-0.5 border border-level-nuclear/40 text-level-nuclear pulse-nuclear rounded-sm glow-nuclear">
        NUCLEAR
      </span>
    );
  }
  if (status === "active") {
    return (
      <span
        className={`font-mono text-xs px-2 py-0.5 border rounded-sm pulse-red ${getLevelColorClass(current_level)}`}
      >
        ACTIVE L{current_level}
      </span>
    );
  }
  return (
    <span className="font-mono text-xs px-2 py-0.5 border border-level-yellow/40 text-level-yellow pulse-yellow rounded-sm">
      MONITORING
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
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
      <div className="bg-surface border border-border rounded-sm px-4 py-3 shadow-2xl whitespace-nowrap">
        <p className="font-mono text-[10px] text-muted mb-2">
          Would you like Karen to send a reminder?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onQuickEscalate(escalation.id)}
            className="font-mono text-[10px] px-2 py-1 border border-karen/40 text-karen hover:bg-karen/10 transition-colors rounded-sm"
          >
            Yes, do it
          </button>
          <button
            onClick={() => onQuickEscalate(escalation.id)}
            className="font-mono text-[10px] px-2 py-1 border border-level-red/40 text-level-red hover:bg-level-red/10 transition-colors rounded-sm"
          >
            Karen will do it anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pre-compute row heights with pretext ─────────────────────────────
function computeRowMetrics(
  escalations: Escalation[],
  containerWidth: number
): RowMetrics[] {
  if (escalations.length === 0 || containerWidth === 0) return [];

  // Column widths approximation (matching the grid: 8% 18% 10% 34% 10% 20%)
  const detailColWidth = Math.max(containerWidth * 0.34 - 32, 80); // minus padding
  const lineHeight = 16; // text-xs line-height
  const metrics: RowMetrics[] = [];
  let currentY = 0;

  for (const esc of escalations) {
    const text = esc.grievance_detail || "---";

    let contentHeight = lineHeight; // minimum one line
    try {
      const prepared = prepare(text, ROW_FONT);
      const result = layout(prepared, detailColWidth, lineHeight);
      contentHeight = Math.max(result.height, lineHeight);
    } catch {
      // Fallback: estimate based on character count
      const charsPerLine = Math.max(Math.floor(detailColWidth / 7.2), 1);
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
      className={`group absolute left-0 right-0 border-b border-border hover:bg-surface/50 transition-colors ${
        isResolved ? "line-through opacity-60" : ""
      }`}
      style={{
        top: metrics.y,
        height: metrics.height,
      }}
    >
      <div className="relative grid grid-cols-[8%_18%_10%_34%_10%_20%] items-center h-full">
        {/* Ref */}
        <div className="font-mono text-xs px-4 text-muted">
          #{escalation.id.slice(0, 6)}
        </div>
        {/* Name */}
        <div className="font-mono text-xs px-4">
          {escalation.target.name}
        </div>
        {/* Amount */}
        <div className="font-mono text-xs px-4 text-karen">
          {escalation.amount ? `$${escalation.amount}` : "---"}
        </div>
        {/* Detail — this is the column that drives variable height */}
        <div className="font-mono text-xs px-4 text-muted break-words">
          {escalation.grievance_detail}
        </div>
        {/* Level */}
        <div className="font-mono text-xs px-4">
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

  // Rotating quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % KAREN_QUOTES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Track container width for pretext layout
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => setContainerWidth(el.clientWidth);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Track scroll position and viewport
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

  // Pre-compute all row metrics using pretext
  const rowMetrics = useMemo(
    () => computeRowMetrics(escalations, containerWidth),
    [escalations, containerWidth]
  );

  const totalHeight = useMemo(() => {
    if (rowMetrics.length === 0) return 0;
    const last = rowMetrics[rowMetrics.length - 1];
    return last.y + last.height;
  }, [rowMetrics]);

  // Binary search for visible range with overscan
  const visibleRange = useMemo(() => {
    if (rowMetrics.length === 0) return { start: 0, end: 0 };

    const top = Math.max(0, scrollTop - OVERSCAN_PX);
    const bottom = scrollTop + viewportHeight + OVERSCAN_PX;

    // Binary search: first row whose bottom edge >= top
    let lo = 0;
    let hi = rowMetrics.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (rowMetrics[mid].y + rowMetrics[mid].height < top) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    const start = lo;

    // Binary search: last row whose top edge <= bottom
    lo = start;
    hi = rowMetrics.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >>> 1;
      if (rowMetrics[mid].y > bottom) {
        hi = mid - 1;
      } else {
        lo = mid;
      }
    }
    const end = lo + 1;

    return { start, end };
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
      } catch {
        // silent — Karen will try again
      }
    },
    [escalations]
  );

  // Stats
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

  // Visible slice
  const visibleEscalations = escalations.slice(
    visibleRange.start,
    visibleRange.end
  );
  const visibleMetrics = rowMetrics.slice(
    visibleRange.start,
    visibleRange.end
  );

  return (
    <div ref={containerRef}>
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total matters", value: totalMatters },
          { label: "Total outstanding", value: `$${totalOutstanding}` },
          { label: "Avg resolution", value: `${avgDays}d` },
          { label: "Currently escaping Karen", value: "0" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="border border-border bg-surface rounded-sm p-4"
          >
            <p className="font-mono text-[10px] text-muted uppercase tracking-wider">
              {label}
            </p>
            <p className="font-display text-2xl font-bold mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Rotating quote */}
      <p className="font-mono text-xs text-karen/80 text-center mb-6 h-4 transition-opacity duration-500">
        &ldquo;{KAREN_QUOTES[quoteIndex]}&rdquo;
      </p>

      {/* Masonry virtual-scrolled table */}
      <div className="border border-border rounded-sm overflow-hidden">
        {/* Sticky column headers */}
        <div
          className="grid grid-cols-[8%_18%_10%_34%_10%_20%] border-b border-border bg-surface"
          style={{ height: HEADER_HEIGHT }}
        >
          {["Ref", "Name", "Amount", "Detail", "Level", "Status"].map((h) => (
            <div
              key={h}
              className="font-mono text-[10px] text-muted uppercase tracking-wider text-left px-4 flex items-center"
            >
              {h}
            </div>
          ))}
        </div>

        {/* Scrollable virtual viewport */}
        <div
          ref={scrollRef}
          className="overflow-y-auto"
          style={{ maxHeight: "70vh" }}
        >
          {escalations.length === 0 ? (
            <div className="px-4 py-8 text-center font-mono text-xs text-muted">
              No matters on record. Karen is idle. For now.
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
