"use client";

export function ThreatBadge({ label, tone }: { label: string; tone?: string }) {
  const palette =
    tone === "green"
      ? "bg-level-green/20 text-level-green"
      : tone === "yellow"
        ? "bg-level-yellow/20 text-level-yellow"
        : tone === "orange"
          ? "bg-level-orange/20 text-level-orange"
          : tone === "purple"
            ? "bg-level-purple/20 text-level-purple"
            : tone === "pink"
              ? "bg-level-nuclear/20 text-level-nuclear"
              : "bg-level-red/20 text-level-red";

  return (
    <span className={`pixel-text inline-flex border-2 border-border px-2 py-1 text-[0.65rem] ${palette}`}>
      {label}
    </span>
  );
}
