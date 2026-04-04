"use client";

import { motion } from "framer-motion";
import type { KarenEvent } from "@/lib/types";

interface DeescalationSequenceProps {
  events: KarenEvent[];
}

export function DeescalationSequence({ events }: DeescalationSequenceProps) {
  const steps = events.filter((e) => e.type === "deescalation_step");

  if (steps.length === 0) return null;

  return (
    <div className="border border-border rounded-sm bg-surface p-5">
      <h3 className="font-display font-semibold text-sm text-karen mb-4">
        De-escalation Sequence
      </h3>

      <div className="space-y-2">
        {steps.map((step, i) => {
          if (step.type !== "deescalation_step") return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.2 }}
              className="flex items-start gap-3"
            >
              <span className="text-sm mt-0.5 shrink-0">
                {step.status === "ok" ? "✓" : "✗"}
              </span>
              <div className="min-w-0">
                <p
                  className={`font-mono text-xs ${
                    step.status === "ok" ? "text-level-green" : "text-level-red"
                  }`}
                >
                  {step.action}
                </p>
                {step.karen_note && (
                  <p className="font-mono text-[10px] text-muted mt-0.5 italic">
                    {step.karen_note}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
