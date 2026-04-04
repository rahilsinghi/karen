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
}: LevelCardProps) {
    const colorClass = getLevelColorClass(level);
    const bgClass = getLevelBgClass(level);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            layout
            className={`relative mb-4 overflow-hidden border-4 p-4 font-mono ${colorClass.replace('text-', 'border-').replace('text-', 'text-')} ${bgClass}`}
        >
            <div className="flex items-center justify-between border-b-2 border-white/10 pb-2 mb-3">
                <div className="flex items-center gap-2 text-[0.7rem] uppercase tracking-tighter">
                    <span className="opacity-70">Level [{level}]</span>
                    <span className="text-white/30">·</span>
                    <span className="font-bold">{channel}</span>
                    <span className="text-white/30">·</span>
                    <span className="text-lg">{emoji}</span>
                </div>
                <div className={`text-[0.65rem] font-bold uppercase tracking-widest px-2 py-0.5 bg-black/40 border-2 ${colorClass.replace('text-', 'border-')}`}>
                    {status}
                </div>
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
                                Next level in {Math.max(1, 10 - Math.floor(progress / 10))}s...
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
