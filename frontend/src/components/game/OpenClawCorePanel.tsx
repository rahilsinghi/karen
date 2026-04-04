import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CrabIdol } from "@/components/CrabIdol";

interface OpenClawCorePanelProps {
    commentary?: string;
    isVictory?: boolean;
}

export const OpenClawCorePanel: React.FC<OpenClawCorePanelProps> = ({ commentary, isVictory }) => {
    return (
        <div className="flex flex-col gap-6 items-center p-6 bg-[#1b1525] border-4 border-[#7e22ce] shadow-[0_0_30px_rgba(126,34,206,0.3)]">
            <div className="mc-font-pixel text-xs text-fortress-pink uppercase tracking-widest">
                OpenClaw God Core
            </div>

            <div className="relative w-48 h-48">
                <CrabIdol className="w-full h-full border-none shadow-none bg-transparent" />

                {/* Breathing Glow */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 bg-purple-500 rounded-full blur-3xl -z-10"
                />
            </div>

            {/* Speech Bubble */}
            <AnimatePresence mode="wait">
                {commentary && (
                    <motion.div
                        key={commentary}
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative mc-container p-4 bg-white text-black max-w-xs"
                    >
                        {/* Pixel Pointer */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-black" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white" />

                        <p className="mc-font-game text-sm leading-tight text-center uppercase">
                            {commentary}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {isVictory && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-yellow-400 border-4 border-black p-2 mc-font-pixel text-[0.6rem] text-black shadow-lg"
                >
                    VICTORY ACHIEVED
                </motion.div>
            )}
        </div>
    );
};
