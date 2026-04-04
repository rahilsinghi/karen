"use client";

import { motion } from "framer-motion";
import { getLevelColorClass, getLevelBgClass } from "@/lib/constants";

interface LevelCardProps {
    level: number;
    channel: string;
    emoji: string;
    status: string;
    label: string;
    messagePreview?: string;
    karenNote?: string;
    isCurrent?: boolean;
    progress?: number;
    remainingSeconds?: number;
}

export function LevelCard({
    level,
    channel,
    emoji,
    status,
    label,
    messagePreview,
    karenNote,
    isCurrent,
    progress = 0,
    remainingSeconds,
}: LevelCardProps) {
    const colorClass = getLevelColorClass(level);
    const bgClass = getLevelBgClass(level);

    const isComplete = status === "COMPLETE";

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            layout
            className={`relative mb-4 overflow-hidden border-4 p-4 font-mono ${colorClass.replace('text-', 'border-').replace('text-', 'text-')} ${bgClass}`}
        >
            {/* Completion flash overlay */}
            {isComplete && (
                <motion.div
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 bg-green-500/20 pointer-events-none z-0"
                />
            )}

            <div className="relative z-10 flex items-center justify-between border-b-2 border-white/10 pb-2 mb-3">
                <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-tighter">
                    <span className="opacity-70">Level [{level}]</span>
                    <span className="text-white/30">·</span>
                    <span className="font-bold">{channel}</span>
                    <span className="text-white/30">·</span>
                    <span className="text-lg">{emoji}</span>
                </div>
                {isComplete ? (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="flex items-center gap-1.5 px-2 py-0.5 bg-green-900/60 border-2 border-green-500/60 rounded"
                    >
                        <svg className="w-3.5 h-3.5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[0.6rem] font-bold text-green-400 tracking-widest">DONE</span>
                    </motion.div>
                ) : (
                    <div className={`text-[0.65rem] font-bold uppercase tracking-widest px-2 py-0.5 bg-black/40 border-2 ${colorClass.replace('text-', 'border-')}`}>
                        {status}
                    </div>
                )}
            </div>

            {messagePreview && (
                <div className="space-y-1 mb-4">
                    <div className="text-[0.75rem] font-bold text-text uppercase line-clamp-1">
                        {messagePreview.split('\n')[0]}
                    </div>
                    <div className="text-[0.7rem] leading-tight text-white/60 line-clamp-2">
                        {messagePreview.length > 100 ? `${messagePreview.substring(0, 100)}...` : messagePreview}
                    </div>
                </div>
            )}

            {karenNote && (
                <div className="mt-4 border-t-2 border-dashed border-white/10 pt-3">
                    <div className="text-[0.65rem] text-red-500 font-bold uppercase mb-1">Karen's Note:</div>
                    <div className="text-[0.85rem] leading-tight text-white/90 italic">
                        &quot;{karenNote}&quot;
                    </div>
                </div>
            )}

            {isCurrent && (
                <div className="mt-4">
                    <div className="h-4 w-full bg-black/40 border-2 border-white/10 relative overflow-hidden">
                        <motion.div
                            className={`h-full ${level === 10 ? 'bg-level-nuclear animate-pulse' : 'bg-current opacity-80'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1 }}
                        />
                        <div className="absolute inset-0 flex items-center px-2">
                            <span className="text-[0.55rem] uppercase font-bold text-white mix-blend-difference">
                                {remainingSeconds != null ? `Next level in ${remainingSeconds}s...` : "Preparing next level..."}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
