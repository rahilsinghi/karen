"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface KarenBossCardProps {
    commentary: string;
}

export function KarenBossCard({ commentary }: KarenBossCardProps) {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
        let index = 0;
        setDisplayedText("");
        const interval = setInterval(() => {
            if (index < commentary.length) {
                setDisplayedText((prev) => prev + commentary[index]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 20);
        return () => clearInterval(interval);
    }, [commentary]);

    return (
        <div className="w-full flex flex-col gap-4">
            {/* The Boss Frame */}
            <div className="boss-frame-obsidian aspect-[4/5] relative flex flex-col overflow-hidden">
                {/* Karen Portrait Placeholder (Pixel Villain Vibe) */}
                <div className="relative flex-1 bg-stone-900 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-0 right-0 h-1/2 bg-red-950/20 shadow-[0_0_40px_rgba(255,0,0,0.2)]" />

                    <div className="relative z-10 text-center scale-150">
                        <span className="text-9xl grayscale opacity-30">💀</span>
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-shadow-pixel text-4xl text-red-500 font-display font-bold uppercase tracking-tighter mix-blend-overlay">
                            KAREN-01
                        </div>
                    </div>

                    {/* Crab Insignia Background */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none text-[300px]">
                        🦀
                    </div>
                </div>

                {/* Boss Info Header */}
                <div className="relative z-20 bg-stone-900 border-t-4 border-stone-800 p-4 border-b-2">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-display text-2xl font-bold text-white text-shadow-pixel mb-0.5">KAREN</h3>
                            <p className="font-mono text-[9px] text-stone-500 font-bold tracking-widest uppercase">Automated Malice Emulator</p>
                        </div>
                        <div className="text-right">
                            <span className="block font-mono text-[8px] text-red-500 font-bold uppercase">MENACE LEVEL</span>
                            <span className="font-display text-xl text-red-600 font-bold scale-110">OMEGA</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <span className="px-1.5 py-0.5 bg-stone-800 text-stone-400 font-mono text-[8px] font-bold border border-stone-700">PERSISTENT</span>
                        <span className="px-1.5 py-0.5 bg-red-950 text-red-400 font-mono text-[8px] font-bold border border-red-900">NOTED</span>
                    </div>
                </div>
            </div>

            {/* The System Log (Commentary) */}
            <div className="boss-frame-obsidian p-6 min-h-[140px] flex flex-col gap-3 relative">
                <div className="absolute top-2 left-3 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                    <span className="font-mono text-[8px] text-red-900 font-bold uppercase tracking-[0.2em]">INTELLIGENCE_STREAM</span>
                </div>

                <div className="flex-1 mt-4">
                    <p className="font-mono text-xs text-stone-300 font-bold leading-relaxed uppercase tracking-tight">
                        <span className="text-stone-700 mr-2">{">"}</span>
                        {displayedText}
                        <span className="w-2 h-4 bg-stone-500 inline-block align-middle ml-1 animate-ping" />
                    </p>
                </div>

                <div className="flex justify-end gap-4 mt-2">
                    <span className="text-xs grayscale opacity-20">🦀</span>
                    <span className="text-xs grayscale opacity-20">🦀</span>
                </div>
            </div>
        </div>
    );
}
