"use client";
import { motion } from "framer-motion";
import { StonePanel } from "@/components/StonePanel";
import { TypewriterText } from "@/components/KarenBossCard";
import type { Escalation, KarenEvent } from "@/lib/types";
import { buildCommentaryFeed } from "@/lib/fortress-data";

export function TransmissionFeed({
    escalation,
    events = [],
}: {
    escalation?: Escalation | null;
    events?: KarenEvent[];
}) {
    const feed = buildCommentaryFeed(events, escalation).slice(-5).reverse();

    return (
        <StonePanel title="TRANSMISSION FEED" eyebrow="LIVE VECTOR" className="w-full">
            <div className="space-y-3 min-h-[12rem]">
                {feed.map((line, idx) => (
                    <motion.div
                        key={`${line}-${idx}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border-l-4 border-fortress-pink pl-3 font-mono text-[0.85rem] leading-tight uppercase text-text"
                    >
                        <TypewriterText text={line} speed={30} />
                    </motion.div>
                ))}
            </div>
        </StonePanel>
    );
}
