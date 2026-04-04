"use client";

import { motion } from "framer-motion";

const sparks = [
  { left: "18%", duration: 2.4, delay: 0 },
  { left: "28%", duration: 3.1, delay: 0.2 },
  { left: "38%", duration: 2.7, delay: 0.4 },
  { left: "48%", duration: 3.3, delay: 0.6 },
  { left: "58%", duration: 2.5, delay: 0.8 },
  { left: "68%", duration: 3.2, delay: 1 },
];

export function CrabIdol({ className = "" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden border-4 border-border bg-[#1a141c] p-2 shadow-inner ${className}`}>
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.68, 0.35], filter: ["blur(18px)", "blur(34px)", "blur(18px)"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute z-0 h-32 w-32 rounded-full bg-fortress-pink"
      />

      <motion.img
        src="/crab_god.png"
        alt="OpenClaw God"
        className="relative z-10 h-full w-full object-contain"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 pointer-events-none z-20">
        {sparks.map((spark, index) => (
          <motion.div
            key={spark.left}
            animate={{ y: [0, -100], x: [0, index % 2 === 0 ? 18 : -18], opacity: [0, 1, 0], scale: [0, 1.3, 0] }}
            transition={{ duration: spark.duration, repeat: Infinity, delay: spark.delay, ease: "easeOut" }}
            className="absolute bottom-[20%] h-1 w-1 bg-fortress-pink"
            style={{ left: spark.left }}
          />
        ))}
      </div>
    </div>
  );
}
