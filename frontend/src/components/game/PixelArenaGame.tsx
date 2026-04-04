import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useArenaGameLoop } from "@/hooks/useArenaGameLoop";
import { CrabPlayer } from "./CrabPlayer";
import { TargetSprite } from "./TargetSprite";
import { ChannelArtifact } from "./ChannelArtifact";
import type { Escalation, KarenEvent } from "@/lib/types";

interface PixelArenaGameProps {
    escalation: Escalation | null;
    events: KarenEvent[];
    onResolve: () => void;
    onContinue: () => void;
    onExit: () => void;
}

export const PixelArenaGame: React.FC<PixelArenaGameProps> = ({
    escalation,
    events,
    onResolve,
    onContinue,
    onExit,
}) => {
    const { crab, target, artifacts, projectiles } = useArenaGameLoop(events, escalation);

    const lastCommentary = useMemo(() => {
        return [...events]
            .reverse()
            .find((e) => e.type === "commentary" || (e.type === "audio" && e.text)) as any;
    }, [events]);

    const currentLevel = escalation?.current_level ?? 0;
    const isVictory = escalation?.status === "resolved";

    return (
        <div className="fixed inset-0 z-50 bg-[#0c0a09] flex flex-col text-white font-mono overflow-hidden">
            {/* TOP HUD */}
            <div className="h-20 bg-[#1c1917] border-b-4 border-black p-4 flex items-center justify-between z-30 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                <div className="flex gap-8 items-center">
                    <div className="flex flex-col">
                        <span className="text-[0.6rem] text-stone-500 uppercase tracking-tighter">Target Specimen</span>
                        <span className="text-xl text-yellow-500 font-bold uppercase">{escalation?.target.name ?? "BINDING"}</span>
                    </div>
                    <div className="h-10 w-1 bg-stone-800" />
                    <div className="flex flex-col">
                        <span className="text-[0.6rem] text-stone-500 uppercase tracking-tighter">Grievance Type</span>
                        <span className="text-sm text-stone-300 uppercase">{escalation?.grievance_type ?? "N/A"}</span>
                    </div>
                    <div className="h-10 w-1 bg-stone-800" />
                    <div className="flex flex-col">
                        <span className="text-[0.6rem] text-stone-500 uppercase tracking-tighter">Mission Level</span>
                        <span className="text-xl text-red-500 font-bold">{currentLevel} / 10</span>
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="flex flex-col items-end">
                        <span className="text-[0.5rem] text-stone-500 mb-1">THREAT CAPACITY</span>
                        <div className="w-48 h-3 bg-black border border-stone-700 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentLevel / 10) * 100}%` }}
                                className="h-full bg-red-600 shadow-[0_0_10px_#ef4444]"
                            />
                        </div>
                    </div>
                    <button
                        onClick={onExit}
                        className="mc-button px-4 h-10 text-[0.6rem] font-bold border-2 border-black bg-stone-800 hover:bg-stone-700 active:translate-y-1 transition-transform"
                    >
                        ABORT GAMIFIED VIEW
                    </button>
                </div>
            </div>

            {/* MIDDLE SECTION */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* LEFT HUD - STATUS */}
                <div className="w-64 bg-[#141110] border-r-4 border-black p-4 flex flex-col gap-6 z-30 overflow-y-auto custom-scrollbar">
                    <div className="mc-container p-3 border-2 border-stone-800 bg-black/40">
                        <div className="text-[0.5rem] text-stone-500 mb-2 font-bold">USED CHANNELS</div>
                        <div className="flex flex-wrap gap-2">
                            {escalation?.channels_used.map((ch, i) => (
                                <div key={i} className="px-2 py-1 bg-purple-900/40 border border-purple-500/50 text-[0.5rem] uppercase rounded">
                                    {ch}
                                </div>
                            ))}
                            {escalation?.channels_used.length === 0 && <span className="text-[0.5rem] text-stone-600">NONE YET</span>}
                        </div>
                    </div>

                    <div className="mc-container p-3 border-2 border-stone-800 bg-black/40 flex-1 flex flex-col">
                        <div className="text-[0.5rem] text-stone-500 mb-2 font-bold uppercase">Commentary Log</div>
                        <div className="flex-1 text-[0.65rem] text-stone-300 leading-tight space-y-3 overflow-y-auto pr-2 custom-scrollbar italic font-serif">
                            {events.filter(e => e.type === "commentary").slice(-5).map((e: any, i) => (
                                <div key={i} className="border-l-2 border-stone-800 pl-2">
                                    "{e.text}"
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto space-y-2">
                        <div className={`p-2 border-2 border-black text-[0.6rem] text-center font-bold tracking-widest ${escalation?.status === "response_detected" ? "bg-orange-900 border-orange-500 text-orange-200" : "bg-green-900 border-green-500 text-green-200"}`}>
                            {escalation?.status === "response_detected" ? "RESPONSE DETECTED" : "OFFENSIVE POSTURE"}
                        </div>
                        <div className={`p-2 border-2 border-black text-[0.6rem] text-center font-bold tracking-widest ${escalation?.status === "payment_detected" ? "bg-emerald-900 border-emerald-500 text-emerald-200" : "bg-stone-900 text-stone-600"}`}>
                            {escalation?.status === "payment_detected" ? "TRIBUTE RECEIVED" : "NO TRIBUTE"}
                        </div>
                    </div>
                </div>

                {/* MAIN ARENA */}
                <div className="flex-1 bg-stone-bricks relative overflow-hidden flex items-center justify-center">
                    {/* Dungeon Floor Texture */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    {/* Redstone Wires Decoration */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
                        <div className="absolute top-10 left-0 w-full h-1 bg-red-600 blur-[2px]" />
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-purple-600 blur-[4px]" />
                        <div className="absolute bottom-10 left-0 w-full h-1 bg-red-600 blur-[2px]" />
                    </div>

                    {/* Crab-God Core at the back */}
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-30 z-0 select-none">
                        <div className="w-32 h-32 rounded-full bg-purple-900/50 blur-xl animate-pulse" />
                        <div className="text-4xl -mt-20">🦀</div>
                        <div className="text-[0.5rem] mt-2 font-bold tracking-[1em] text-purple-400">OPENCLAW CORE</div>
                    </div>

                    {/* Game Entities */}
                    <div className="relative w-full h-full max-w-4xl max-h-[80%] mx-auto">
                        <AnimatePresence>
                            {artifacts.map((a) => (
                                <ChannelArtifact key={a.id} {...a} />
                            ))}
                            {projectiles.map((p) => (
                                <motion.div
                                    key={p.id}
                                    className="absolute w-8 h-8 -ml-4 -mt-4 text-2xl z-25 drop-shadow-[0_0_10px_#ef4444]"
                                    initial={{ left: `${crab.x}%`, top: `${crab.y}%`, scale: 0.5 }}
                                    animate={{ left: `${target.x}%`, top: `${target.y}%`, scale: 1.5, rotate: 360 }}
                                    exit={{ scale: 2, opacity: 0 }}
                                    transition={{ duration: 0.8, ease: "easeIn" }}
                                >
                                    💥
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <CrabPlayer {...crab} />
                        <TargetSprite {...target} name={escalation?.target.name ?? "Target"} />
                    </div>

                    {/* Commentary/Speech Bubbles on Crab */}
                    {lastCommentary && (
                        <motion.div
                            key={lastCommentary.timestamp}
                            initial={{ scale: 0, opacity: 0, y: 0 }}
                            animate={{ scale: 1, opacity: 1, y: -100 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute z-40 bg-white text-black px-4 py-2 rounded-xl text-[0.7rem] font-bold border-4 border-black max-w-xs shadow-[8px_8px_0_rgba(0,0,0,0.5)]"
                            style={{ left: `${crab.x}%`, top: `${crab.y}%` }}
                        >
                            {lastCommentary.text}
                            {/* Tail */}
                            <div className="absolute -bottom-4 left-4 w-4 h-4 bg-white border-b-4 border-r-4 border-black rotate-45" />
                        </motion.div>
                    )}
                </div>

                {/* RIGHT HUD - DOSSIER / INTEL */}
                <div className="w-80 bg-[#141110] border-l-4 border-black p-4 flex flex-col gap-4 z-30">
                    <div className="mc-container p-4 border-2 border-stone-800 bg-black/40 h-full flex flex-col">
                        <div className="text-[0.6rem] text-yellow-500 mb-2 font-bold uppercase flex items-center gap-2">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                            BATTLE DOSSIER
                        </div>
                        <div className="text-[0.7rem] text-stone-100 uppercase leading-relaxed h-32 overflow-y-auto custom-scrollbar">
                            {escalation?.grievance_detail}
                        </div>

                        <div className="mt-8 pt-4 border-t border-stone-800">
                            <div className="text-[0.5rem] text-stone-500 mb-2 uppercase">INITIATOR</div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-900 border-2 border-indigo-400 rounded flex items-center justify-center text-xl">
                                    🤴
                                </div>
                                <div className="text-sm font-bold uppercase">{escalation?.initiator.name}</div>
                            </div>
                        </div>

                        <div className="mt-auto p-3 bg-red-950/20 border-2 border-red-900/50 text-[0.45rem] leading-normal text-red-300">
                            <div className="font-bold mb-1 underline">MISSION DIRECTIVE</div>
                            PERSIST UNTIL COMPLIANCE IS VERIFIED OR THE DEBT IS SATIATED BY FORCE. THE FORTRESS DOES NOT FORGIVE.
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM HUD - ACTIONS */}
            <div className="h-24 bg-[#1c1917] border-t-4 border-black p-4 flex gap-6 items-center justify-center z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
                <div className="flex gap-4">
                    <button
                        onClick={onContinue}
                        disabled={isVictory}
                        className="mc-button h-12 px-10 text-[0.65rem] font-bold bg-[#7f1d1d] hover:bg-[#991b1b] active:scale-[0.98] border-b-4 border-black disabled:opacity-30 flex flex-col items-center justify-center"
                    >
                        <span>CONTINUE ONSLAUGHT</span>
                        <span className="text-[0.4rem] opacity-50">BYPASS DEFENSES</span>
                    </button>
                    <button
                        onClick={onResolve}
                        disabled={isVictory}
                        className="mc-button h-12 px-10 text-[0.65rem] font-bold bg-[#27272a] hover:bg-[#3f3f46] active:scale-[0.98] border-b-4 border-black disabled:opacity-30 flex flex-col items-center justify-center"
                    >
                        <span>DE-ESCALATE</span>
                        <span className="text-[0.4rem] opacity-50">ACCEPT OFFERING</span>
                    </button>
                </div>
            </div>

            {/* VICTORY OVERLAY */}
            <AnimatePresence>
                {isVictory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-12"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="mc-container bg-white text-black p-12 text-center max-w-2xl border-b-8 border-black shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                        >
                            <h1 className="text-5xl font-black mb-4 tracking-tighter italic">VICTORY</h1>
                            <div className="w-full h-1 bg-black mb-8" />
                            <p className="text-xl font-bold uppercase leading-tight mb-12">
                                ALL RESOLVED. RELATIONSHIPS RESTORED BY FORCE. THE TARGET HAS SURRENDERED CONTROL TO THE CRAB-GOD.
                            </p>
                            <button
                                onClick={onExit}
                                className="w-full h-16 bg-black text-white text-xl font-bold hover:bg-stone-900 active:scale-[0.98] transition-transform"
                            >
                                RETURN TO LOBBY
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
        .bg-stone-bricks {
          background-color: #386641;
          background-image: url('/pixel_town_bg.png');
          background-size: cover;
          background-position: center;
          image-rendering: pixelated;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
        }
      `}</style>
        </div>
    );
};
