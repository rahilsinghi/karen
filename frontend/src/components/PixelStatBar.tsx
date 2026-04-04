"use client";

import { motion } from "framer-motion";

export function PixelStatBar({
  label,
  value,
  max = 100,
  color = "#ff5533",
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  const width = `${Math.max(0, Math.min(100, (value / max) * 100))}%`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="pixel-text text-[0.55rem] text-muted">{label}</span>
        <span className="pixel-text text-[0.55rem] text-text">{value}/{max}</span>
      </div>
      <div className="border-4 border-border bg-[#161219] p-1">
        <motion.div initial={{ width: 0 }} animate={{ width }} className="h-3" style={{ background: color }} />
      </div>
    </div>
  );
}
