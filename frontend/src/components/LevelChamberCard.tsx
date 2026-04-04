"use client";

import { motion } from "framer-motion";
import { levelColor } from "@/lib/fortress-data";

export function LevelChamberCard({
  level,
  label,
  active,
  complete,
}: {
  level: number;
  label: string;
  active?: boolean;
  complete?: boolean;
}) {
  const color = levelColor(level);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0, scale: active ? 1.02 : 1 }}
      className={`fortress-panel relative px-4 py-3 ${active ? "ring-4 ring-fortress-pink/35" : ""} ${complete ? "opacity-80" : ""}`}
      style={{ backgroundColor: active ? `${color}22` : undefined }}
    >
      <div className="flex items-center gap-4">
        <div
          className="pixel-text flex h-12 w-12 items-center justify-center border-4 border-border text-[0.95rem]"
          style={{ backgroundColor: color, color: "#120f16" }}
        >
          {level}
        </div>
        <div>
          <div className="pixel-text text-[0.72rem] text-text">{label}</div>
          <div className="font-mono text-[0.95rem] uppercase text-muted">
            {active ? "ACTIVE FLOOR" : complete ? "CHAMBER CLEARED" : "SEALED BELOW"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
