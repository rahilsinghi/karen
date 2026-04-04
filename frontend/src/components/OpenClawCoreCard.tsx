"use client";

import { motion } from "framer-motion";
import { StonePanel } from "@/components/StonePanel";
import { PixelStatBar } from "@/components/PixelStatBar";
import { CrabBracket } from "@/components/CrabBracket";
import { buildCommentaryFeed } from "@/lib/fortress-data";
import type { Escalation, KarenEvent } from "@/lib/types";

export function OpenClawCoreCard({
  escalation,
  events = [],
  status = "AWAKE",
}: {
  escalation?: Escalation | null;
  events?: KarenEvent[];
  status?: string;
}) {
  const feed = buildCommentaryFeed(events, escalation).slice(-4).reverse();

  return (
    <StonePanel title="OPENCLAW GOD" eyebrow="CRAB-CORE SHRINE" className="h-full">
      <div className="flex h-full flex-col gap-4">
        <div className="stone-brick-wall fortress-panel relative overflow-hidden p-3">
          <CrabBracket />
          <div className="wire-run animate-wire-pulse absolute left-[-2rem] right-[-2rem] top-4 h-2 opacity-70" />
          <motion.div
            animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.06, 1] }}
            transition={{ duration: 2.8, repeat: Infinity }}
            className="absolute inset-[18%] rounded-full bg-fortress-pink blur-3xl"
          />
          <div className="relative border-4 border-border bg-[#33141e] p-3 shadow-[inset_4px_4px_0_rgba(255,255,255,0.08),inset_-4px_-4px_0_rgba(0,0,0,0.4)]">
            <div className="relative mx-auto flex aspect-square max-w-[280px] items-center justify-center border-8 border-[#44403c] bg-black shadow-[inset_4px_4px_0_#000,inset_-4px_-4px_0_#78716c]">
              <img
                src="/active_karen_portrait.png"
                alt="Karen"
                className="h-full w-full object-cover image-rendering-pixelated"
              />
            </div>
            <div className="mt-4 border-4 border-border bg-[#1a101a] px-3 py-2 text-center">
              <div className="pixel-text text-[0.6rem] text-muted">KAREN_CORE_STATUS</div>
              <div className="pixel-text text-[0.9rem] text-fortress-pink">{status}</div>
            </div>
          </div>

          <div className="stone-brick-wall fortress-panel grid grid-cols-3 gap-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-11 border-4 border-border bg-[#3b3640]" />
            ))}
          </div>

          <PixelStatBar label="CORE HEAT" value={88} color="#ff4fd8" />
          <PixelStatBar label="MALICE FLOW" value={72} color="#ff5533" />

          <div className="fortress-panel flex-1 p-3">
            <div className="pixel-text text-[0.6rem] text-muted">TRANSMISSION FEED</div>
            <div className="mt-3 space-y-3">
              {feed.map((line) => (
                <motion.div
                  key={line}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l-4 border-fortress-pink pl-3 font-mono text-[1rem] uppercase text-text"
                >
                  {line}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </StonePanel>
  );
}
