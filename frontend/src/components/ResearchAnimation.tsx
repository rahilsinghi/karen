"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { KarenEvent } from "@/lib/types";

interface ResearchAnimationProps {
  events: KarenEvent[];
}

interface ResearchStep {
  step: number;
  detail: string;
  pauseMs: number;
}

export default function ResearchAnimation({ events }: ResearchAnimationProps) {
  const [visibleSteps, setVisibleSteps] = useState<ResearchStep[]>([]);
  const [discoveryData, setDiscoveryData] = useState<{
    target: string;
    employer: string;
    work_email: string;
    coworker_name: string;
    coworker_email: string;
  } | null>(null);

  useEffect(() => {
    const steps: ResearchStep[] = [];
    let discovery = null;

    for (const event of events) {
      if (event.type === "research_step") {
        steps.push({
          step: event.step,
          detail: event.detail,
          pauseMs: event.pause_ms ?? 400,
        });
      }
      if (event.type === "research_discovery") {
        discovery = {
          target: event.target,
          employer: event.employer,
          work_email: event.work_email,
          coworker_name: event.coworker_name,
          coworker_email: event.coworker_email,
        };
      }
    }

    setVisibleSteps(steps);
    setDiscoveryData(discovery);
  }, [events]);

  if (visibleSteps.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#1e1e2e] bg-[#0a0a0f] p-4 font-mono text-sm">
      <div className="mb-2 text-xs text-[#6b6b8a] uppercase tracking-wider">
        Karen OSINT Module
      </div>
      <AnimatePresence mode="popLayout">
        {visibleSteps.map((step) => {
          const isWorkEmail = step.detail.includes("Confidence:");
          const isDomainStep = step.detail.includes("Inferring work email");

          return (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`mb-1 flex items-start gap-2 ${
                isWorkEmail
                  ? "text-[#ef4444] font-bold"
                  : isDomainStep
                  ? "text-[#eab308]"
                  : "text-[#22c55e]"
              }`}
            >
              <span className="text-[#6b6b8a] select-none">{">"}</span>
              <TypewriterText
                text={step.detail}
                speed={isWorkEmail ? 30 : 15}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {discoveryData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-4 rounded border border-[#22c55e]/30 bg-[#22c55e]/5 p-3"
        >
          <div className="text-xs text-[#22c55e] uppercase tracking-wider mb-2">
            Research Complete
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[#6b6b8a]">Employer:</span>{" "}
              <span className="text-[#f8f8ff]">{discoveryData.employer}</span>
            </div>
            <div>
              <span className="text-[#6b6b8a]">Work Email:</span>{" "}
              <span className="text-[#ef4444]">{discoveryData.work_email}</span>
            </div>
            <div>
              <span className="text-[#6b6b8a]">Colleague:</span>{" "}
              <span className="text-[#f8f8ff]">{discoveryData.coworker_name}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <span className="animate-pulse text-[#22c55e]">_</span>
      )}
    </span>
  );
}
