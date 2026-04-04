"use client";

import { Suspense, use } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEscalation } from "@/hooks/useEscalation";
import { KarenGameMode } from "@/components/game/KarenGameMode";
import { PixelArenaGame } from "@/components/game/PixelArenaGame";
import { useKarenAudio } from "@/hooks/useKarenAudio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { RitualButton } from "@/components/RitualButton";
import { motion } from "framer-motion";

function GamePageInner({ id }: { id: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { escalation, events, continueAnyway, resolve } = useEscalation(id);
    const [audioEnabled, setAudioEnabled] = useState(searchParams.get("resonance") === "true");
    const { start, stop, setLevel, duck, unduck } = useBackgroundMusic();

    useKarenAudio(events, {
        enabled: audioEnabled,
        onPlayStart: duck,
        onPlayEnd: unduck,
    });

    useEffect(() => {
        if (audioEnabled) void start();
        else stop();
    }, [audioEnabled, start, stop]);

    useEffect(() => {
        if (audioEnabled) setLevel(escalation?.current_level ?? 1);
    }, [audioEnabled, escalation?.current_level, setLevel]);

    if (!audioEnabled) {
        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black overflow-hidden relative">
                {/* Background Dungeons */}
                <div className="absolute inset-0 z-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: 'url("/dungeon_bg.png")' }} />

                {/* Darkness Vignette */}
                <div className="absolute inset-0 z-10 bg-radial-vignette pointer-events-none" />

                <div className="mc-container max-w-xl p-10 text-center bg-[#c6c6c6] relative z-20 shadow-[0_0_100px_rgba(239,68,68,0.2)]">
                    <div className="mb-8 flex justify-center">
                        <motion.div
                            animate={{
                                filter: ["drop-shadow(0 0 5px #ef4444)", "drop-shadow(0 0 20px #ef4444)", "drop-shadow(0 0 5px #ef4444)"]
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="text-6xl"
                        >
                            🦀
                        </motion.div>
                    </div>
                    <h1 className="mc-font-pixel text-3xl mb-4 text-black tracking-tight">UNSEAL THE SONIC ARCHIVE</h1>
                    <p className="mc-font-game text-lg mb-10 text-[#3f3f3f] leading-relaxed uppercase">
                        THE KAREN ENTITY COMMUNICATES THROUGH VIBRATIONS.
                        FAILING TO ENABLE RESONANCE WILL RESULT IN AN INCOMPLETE RITUAL.
                    </p>
                    <button
                        onClick={() => setAudioEnabled(true)}
                        className="mc-button w-full h-20 mc-font-pixel text-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                        ESTABLISH RESONANCE
                    </button>
                    <div className="mt-6 mc-font-pixel text-[0.6rem] text-stone-500 uppercase">
                        Requires Audio Output Device // Unseal at your own risk
                    </div>
                </div>

                <style jsx>{`
                    .bg-radial-vignette {
                        background: radial-gradient(circle, transparent 20%, black 85%);
                    }
                `}</style>
            </div>
        );
    }

    return (
        <PixelArenaGame
            escalation={escalation}
            events={events}
            onResolve={() => void resolve()}
            onContinue={() => void continueAnyway()}
            onExit={() => router.push(`/escalation/${id}`)}
        />
    );
}

export default function EscalationGamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <Suspense fallback={<div className="bg-black min-h-screen flex items-center justify-center pixel-text text-white">CALIBRATING SONIC MATRICES...</div>}>
            <GamePageInner id={id} />
        </Suspense>
    );
}
