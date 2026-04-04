"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LEVEL_LABELS, getLevelColorClass } from "@/lib/constants";

interface EscalationTowerProps {
    currentLevel: number;
}

const LEVEL_ICONS: Record<number, string> = {
    1: "📜", // Email Scroll
    2: "📱", // SMS Rune
    3: "💀", // WhatsApp Skull Orb
    4: "👁️", // CC Sigil / Witness
    5: "💼", // LinkedIn Briefcase
    6: "🕯️", // Calendar Ritual
    7: "🚨", // Discord Siren
    8: "📖", // Open Matters Ledger
    9: "🐦", // Twitter Chaos
    10: "☢️", // FedEx Doom
};

export function EscalationTower({ currentLevel }: EscalationTowerProps) {
    return (
        <div className="relative h-full flex flex-col-reverse justify-between items-center py-12 px-8 redstone-circuit boss-frame-obsidian overflow-hidden">
            {/* The Vertical Rail */}
            <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-stone-900 border-x-4 border-stone-800" />

            {/* Escalation Platforms */}
            {Array.from({ length: 10 }, (_, i) => {
                const level = i + 1;
                const isActive = level === currentLevel;
                const isPast = level < currentLevel;

                return (
                    <motion.div
                        key={level}
                        initial={false}
                        animate={{
                            scale: isActive ? 1.1 : 1,
                            opacity: level > currentLevel + 2 ? 0.3 : 1,
                        }}
                        className={`relative z-10 w-full max-w-[280px] h-20 flex items-center justify-center transition-all duration-500`}
                    >
                        {/* The Platform Slab */}
                        <div
                            className={`absolute inset-x-0 bottom-0 h-4 bg-stone-700 border-t-2 border-stone-500 shadow-2xl transition-all duration-500 ${isActive ? "bg-stone-500 border-stone-300 scale-105" : ""
                                } ${isPast ? "opacity-60" : ""}`}
                        />

                        {/* Level Indicator */}
                        <div className={`absolute -left-12 font-display text-2xl font-bold transition-colors duration-500 ${isActive ? "text-red-500 text-shadow-pixel" : "text-stone-700"
                            }`}>
                            {level}
                        </div>

                        {/* Icon & Label */}
                        <div className="flex flex-col items-center gap-1">
                            <span className={`text-4xl transition-all duration-500 ${isActive ? "scale-125 drop-shadow-[0_0_15px_rgba(255,0,0,0.8)]" : "grayscale opacity-50"}`}>
                                {LEVEL_ICONS[level]}
                            </span>
                            <AnimatePresence>
                                {isActive && (
                                    <motion.span
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="font-mono text-[10px] text-white font-bold uppercase tracking-widest bg-red-900 px-2 py-0.5 border border-red-500"
                                    >
                                        {LEVEL_LABELS[level]}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Active Glow Overlay */}
                        {isActive && (
                            <motion.div
                                layoutId="active-glow"
                                className={`absolute inset-0 z-[-1] ${level === 10 ? 'nuclear-glow-pink' : 'redstone-glow'} opacity-40`}
                                animate={{ opacity: [0.2, 0.4, 0.2] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                        )}
                    </motion.div>
                );
            })}

            {/* Warning Decorations */}
            <div className="absolute top-4 left-4 font-mono text-[8px] text-red-900 font-bold uppercase pointer-events-none">
                CAUTION: VERTICAL ESCALATION ENGAGED
            </div>
            <div className="absolute bottom-4 right-4 font-mono text-[8px] text-red-900 font-bold uppercase pointer-events-none">
                NO EXIT DEPLOYED
            </div>
        </div>
    );
}
