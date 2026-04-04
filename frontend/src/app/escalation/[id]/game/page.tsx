"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PixelArenaGame } from "@/components/game/PixelArenaGame";
import { useEscalationContext } from "@/contexts/EscalationContext";
import { motion } from "framer-motion";

function GamePageInner({ id }: { id: string }) {
    const router = useRouter();
    const { escalation, events, continueAnyway, resolve, audioEnabled, setAudioEnabled } = useEscalationContext();

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
                    <h1 className="mc-font-pixel text-3xl mb-8 text-black tracking-tight">UNSEAL THE SONIC ARCHIVE</h1>
                    <button
                        onClick={() => setAudioEnabled(true)}
                        className="mc-button w-full h-20 mc-font-pixel text-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                        ESTABLISH RESONANCE
                    </button>
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
    return <GamePageInner id={id} />;
}
