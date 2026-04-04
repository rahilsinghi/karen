"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { prepare, layout } from "@chenglou/pretext";
import { useCircle } from "@/hooks/useCircle";
import { OpenMattersTable } from "@/components/OpenMattersTable";

// ─── Dynamic headline sizing via pretext binary search ────────────────
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

  useEffect(() => {
    const el = headlineRef.current;
    if (!el) return;
    const measure = () => setHeadlineWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const headlineText = "THE WAR ROOM";
  const headlineFontSize = useDynamicHeadline(
    headlineText,
    "Silkscreen, sans-serif",
    headlineWidth,
    32,
    100
  );

  const activeCount = escalations.filter((e) => e.status !== "resolved").length;
  const animatedCount = useCountUp(activeCount);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-12 animate-pulse">
        <div className="mb-10 space-y-4">
          <div className="h-20 w-3/4 bg-stone-900 pixel-border-stone" />
          <div className="h-6 w-1/2 bg-stone-900 pixel-border-stone" />
        </div>
        <div className="space-y-4">
          <div className="h-12 bg-stone-900 pixel-border-stone" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-stone-900/50 pixel-border-stone" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-12" ref={headlineRef}>
        <h1
          className="font-display font-bold tracking-tighter leading-none whitespace-nowrap overflow-hidden uppercase text-shadow-pixel"
          style={{ fontSize: headlineFontSize }}
        >
          {headlineText}
        </h1>
        <div className="flex items-center justify-between mt-4">
          <p className="font-mono text-sm text-stone-500 font-bold uppercase tracking-tight">
            PUBLIC ACCOUNTABILITY LOG — KAREN AUTOMATED MALICE EMULATOR
          </p>
          {activeCount > 0 && (
            <p className="font-mono text-lg text-red-600 font-bold uppercase animate-pulse">
              {animatedCount} ENGAGED {animatedCount === 1 ? "TARGET" : "TARGETS"}
            </p>
          )}
        </div>
      </div>

      <OpenMattersTable escalations={escalations} />

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t-4 border-stone-900 text-center space-y-3">
        <p className="font-mono text-sm text-stone-500 font-bold uppercase italic">
          KAREN NEVER FORGETS. KAREN NEVER FORGIVES.
        </p>
        <p className="font-mono text-[10px] text-stone-700 font-bold uppercase">
          &copy; KAREN MALICE SYSTEMS — ALL RIGHTS RESERVED. ALL MATTERS LOGGED. ALL DEBTS REMEMBERED.
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
