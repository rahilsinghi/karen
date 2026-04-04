import React from "react";
import { EscalationTowerScene } from "./EscalationTowerScene";
import { OpenClawCorePanel } from "./OpenClawCorePanel";
import { LevelTimeline } from "@/components/LevelTimeline";
import { useEventGameState } from "@/hooks/useEventGameState";
import type { Escalation, KarenEvent } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

interface KarenGameModeProps {
    escalation: Escalation | null;
    events: KarenEvent[];
    onResolve: () => void;
    onContinue: () => void;
    onExit: () => void;
}

export const KarenGameMode: React.FC<KarenGameModeProps> = ({
    escalation,
    events,
    onResolve,
    onContinue,
    onExit,
}) => {
    const gameState = useEventGameState(events, escalation);
    const { chambers, currentLevel, isVictory, lastCommentary, responseDetected, paymentDetected, targetName, grievance } = gameState;

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col text-white font-mono overflow-hidden">
            {/* HUD - TOP */}
            <div className="h-20 bg-[#1c1917] border-b-8 border-black p-4 flex items-center justify-between">
                <div className="flex gap-6 items-center">
                    <div className="flex flex-col">
                        <span className="mc-font-pixel text-[0.6rem] text-muted uppercase">Target</span>
                        <span className="mc-font-game text-xl text-yellow-500 uppercase tracking-wide">{targetName}</span>
                    </div>
                    <div className="w-px h-8 bg-black/50" />
                    <div className="flex flex-col">
                        <span className="mc-font-pixel text-[0.6rem] text-muted uppercase">Level</span>
                        <span className="mc-font-game text-xl text-white uppercase">{currentLevel} / 10</span>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="mc-font-pixel text-[0.5rem] mb-1">Ritual Charge</span>
                        <div className="w-48 h-4 bg-black border-2 border-[#44403c] overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: `${(currentLevel / 10) * 100}%` }}
                                className="h-full bg-red-600 shadow-[0_0_10px_#ef4444]"
                            />
                        </div>
                    </div>
                    <button
                        onClick={onExit}
                        className="mc-button px-4 h-10 flex items-center justify-center mc-font-pixel text-[0.6rem]"
                    >
                        EXIT GAME
                    </button>
                </div>
            </div>

            {/* MAIN GAME SCENE */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Stats/Dossier + Level Timeline */}
                <div className="w-1/4 flex flex-col bg-[#0c0a09] border-r-8 border-black overflow-hidden">
                    <div className="p-4 flex-shrink-0">
                        <div className="p-4 flex flex-col gap-3 border-2 border-stone-700 bg-[#1a1816] rounded">
                            <div className="text-[0.68rem] text-amber-400 font-bold border-b-2 border-stone-700 pb-2 tracking-wider">GRIEVANCE DOSSIER</div>
                            <div className="text-sm text-stone-100 uppercase line-clamp-3">
                                {grievance}
                            </div>
                            <div className="flex gap-2 mt-1">
                                <div className={`text-[0.6rem] text-center border-2 px-2 py-1 flex-1 font-bold rounded ${responseDetected ? "bg-red-900 border-red-700 text-red-200" : "bg-green-900/80 border-green-700 text-green-200"}`}>
                                    {responseDetected ? "RESISTING" : "COMPLYING"}
                                </div>
                                <div className={`text-[0.6rem] text-center border-2 px-2 py-1 flex-1 font-bold rounded ${paymentDetected ? "bg-yellow-900 border-yellow-700 text-yellow-200" : "bg-stone-900 border-stone-700 text-stone-500"}`}>
                                    {paymentDetected ? "TRIBUTE" : "NO TRIBUTE"}
                                </div>
                            </div>
                            {gameState.deescalationActive && (
                                <div className="p-2 bg-indigo-900/80 border-2 border-indigo-500 rounded">
                                    <div className="text-[0.5rem] mb-1 text-indigo-300 font-bold">RITUAL REVERSAL</div>
                                    <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ opacity: [0.2, 1, 0.2] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                className="flex-1 h-2 bg-indigo-400"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Level Timeline — scrollable */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                        <LevelTimeline events={events} currentLevel={currentLevel} />
                    </div>
                </div>

                {/* Center Tower */}
                <div className="flex-1 flex items-center justify-center p-8 bg-dungeon-bricks relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: 'url("/dungeon_bg.png")' }} />
                    <div className="relative z-10 w-full h-full flex items-center justify-center">
                        <EscalationTowerScene chambers={chambers} currentLevel={currentLevel} />
                    </div>
                </div>

                {/* Right Core */}
                <div className="w-1/4 p-6 bg-[#0c0a09] border-l-8 border-black">
                    <OpenClawCorePanel
                        commentary={lastCommentary}
                        isVictory={isVictory}
                    />
                </div>
            </div>

            {/* GAME ACTIONS - BOTTOM */}
            <div className="h-24 bg-[#1c1917] border-t-8 border-black p-4 flex gap-4 items-center justify-center">
                <button
                    onClick={onContinue}
                    disabled={isVictory}
                    className="mc-button h-12 px-8 mc-font-pixel text-xs bg-red-800 text-white enabled:hover:bg-red-700 disabled:opacity-50"
                >
                    CONTINUE RITUAL
                </button>
                <button
                    onClick={onResolve}
                    disabled={isVictory}
                    className="mc-button h-12 px-8 mc-font-pixel text-xs"
                >
                    DE-ESCALATE FORCE
                </button>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {isVictory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-12"
                    >
                        <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            className="mc-container bg-white text-black p-12 text-center max-w-2xl"
                        >
                            <h1 className="mc-font-pixel text-4xl mb-8">VICTORY</h1>
                            <p className="mc-font-game text-xl mb-12 uppercase">
                                THE TARGET HAS BENT THE KNEE.
                                RELATIONSHIPS HAVE BEEN RESTORED BY FORCE.
                                THE FORTRESS IS SATIATED.
                            </p>
                            <button onClick={onExit} className="mc-button w-full h-16 mc-font-pixel text-xl">
                                RETURN TO LOBBY
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
        .bg-dungeon-bricks {
          background: #0a0a0a;
          box-shadow: inset 0 0 100px rgba(0, 0, 0, 0.9);
          position: relative;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0c0a09;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #44403c;
          border: 2px solid #0c0a09;
        }
      `}</style>
        </div>
    );
};
