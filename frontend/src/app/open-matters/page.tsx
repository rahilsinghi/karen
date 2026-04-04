"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { prepare, layout } from "@chenglou/pretext";
import { useCircle } from "@/hooks/useCircle";
import { OpenMattersTable } from "@/components/OpenMattersTable";

// ─── Dynamic headline sizing via pretext binary search ────────────────
// Finds the largest font-size (in whole px) where the text fits on a
// single line within `maxWidth`. Uses pretext's prepare + layout to
// measure with real canvas metrics rather than guessing.

function useDynamicHeadline(
  text: string,
  fontFamily: string,
  maxWidth: number,
  minSize: number,
  maxSize: number
): number {
  const [fontSize, setFontSize] = useState(minSize);

  useEffect(() => {
    if (maxWidth <= 0) return;

    // Binary search: largest size that keeps lineCount === 1
    let lo = minSize;
    let hi = maxSize;
    let best = minSize;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const font = `700 ${mid}px ${fontFamily}`;
      try {
        const prepared = prepare(text, font);
        const result = layout(prepared, maxWidth, mid * 1.1);

        if (result.lineCount <= 1) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      } catch {
        // Canvas not ready — fall back to minimum
        hi = mid - 1;
      }
    }

    setFontSize(best);
  }, [text, fontFamily, maxWidth, minSize, maxSize]);

  return fontSize;
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function OpenMattersPage() {
  const { escalations, loading } = useCircle();
  const headlineRef = useRef<HTMLDivElement>(null);
  const [headlineWidth, setHeadlineWidth] = useState(0);

  // Measure available width for headline
  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;

    const measure = () => setHeadlineWidth(el.clientWidth);
    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const headlineText = "OPEN MATTERS";
  const headlineFontSize = useDynamicHeadline(
    headlineText,
    "Syne, sans-serif",
    headlineWidth,
    32,
    120
  );

  // Count animation for stats
  const activeCount = escalations.filter((e) => e.status !== "resolved").length;
  const animatedCount = useCountUp(activeCount);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
        <div className="mb-8 space-y-3">
          <div className="h-14 w-80 bg-border/30 rounded" />
          <div className="h-4 w-96 bg-border/20 rounded" />
        </div>
        <div className="space-y-2">
          {/* Table header skeleton */}
          <div className="h-10 bg-border/20 rounded-sm" />
          {/* Table row skeletons */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-surface rounded-sm border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8" ref={headlineRef}>
        <h1
          className="font-display font-bold tracking-tight leading-none whitespace-nowrap overflow-hidden"
          style={{ fontSize: headlineFontSize }}
        >
          {headlineText}
        </h1>
        <div className="flex items-center justify-between mt-3">
          <p className="font-mono text-xs text-muted">
            Public accountability registry — Karen Automated Correspondence
            Systems LLC
          </p>
          {activeCount > 0 && (
            <p className="font-mono text-xs text-level-red">
              {animatedCount} active {animatedCount === 1 ? "matter" : "matters"}
            </p>
          )}
        </div>
      </div>

      <OpenMattersTable escalations={escalations} />

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-border text-center space-y-1">
        <p className="font-mono text-xs text-muted">
          Karen is always watching. Karen means well.
        </p>
        <p className="font-mono text-[10px] text-muted/60">
          &copy; Karen Automated Correspondence Systems LLC — All rights
          reserved. All matters documented. All debts remembered.
        </p>
      </footer>
    </div>
  );
}

// ─── Count-up hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(0);

  const animate = useCallback(
    (start: number, end: number, startTime: number) => {
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(start + (end - start) * eased));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(step);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [duration]
  );

  useEffect(() => {
    animate(0, target, performance.now());
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, animate]);

  return value;
}
