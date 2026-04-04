"use client";

import { motion } from "framer-motion";
import type { ArsenalArtifact } from "@/lib/fortress-data";
import { ThreatBadge } from "@/components/ThreatBadge";

export function ArsenalCard({
  artifact,
  active,
  onClick,
}: {
  artifact: ArsenalArtifact;
  active?: boolean;
  onClick?: () => void;
}) {
  const tone =
    artifact.status === "READY"
      ? "green"
      : artifact.status === "CHARGING"
        ? "orange"
        : artifact.status === "LOCKED"
          ? "purple"
          : "pink";

  return (
    <motion.button
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`fortress-panel h-full p-4 text-left ${active ? "ring-4 ring-fortress-pink/40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="pixel-text text-[1.3rem] text-fortress-pink">{artifact.icon}</div>
          <div className="pixel-text mt-2 text-[0.85rem] text-text">{artifact.name}</div>
        </div>
        <ThreatBadge label={artifact.status} tone={tone} />
      </div>
      <div className="mt-3 grid gap-1 font-mono text-[0.95rem] uppercase text-muted">
        <div>{artifact.tier}</div>
        <div>{artifact.unlock}</div>
      </div>
      <p className="mt-3 font-mono text-[1rem] uppercase text-text">{artifact.description}</p>
    </motion.button>
  );
}
