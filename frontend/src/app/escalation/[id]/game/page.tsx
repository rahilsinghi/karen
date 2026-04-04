"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useEscalation } from "@/hooks/useEscalation";
import { KarenGameMode } from "@/components/game/KarenGameMode";
import { useKarenAudio } from "@/hooks/useKarenAudio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { useEffect } from "react";
import { RitualButton } from "@/components/RitualButton";

function GamePageInner({ id }: { id: string }) {
    const router = useRouter();
    const { escalation, events, continueAnyway, resolve } = useEscalation(id);
    const [audioEnabled, setAudioEnabled] = useState(false);
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
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black p-6">
                <div className="mc-container max-w-xl p-8 text-center bg-[#c6c6c6]">
                    <h1 className="mc-font-pixel text-2xl mb-6 text-black">ENABLE GAME AUDIO</h1>
                    <p className="mc-font-game text-xl mb-8 text-[#3f3f3f] uppercase">
                        THE FORTRESS REQUIRES SONIC RESONANCE TO OPERATE AT FULL CAPACITY.
                    </p>
                    <button
                        onClick={() => setAudioEnabled(true)}
                        className="mc-button w-full h-16 mc-font-pixel text-lg"
                    >
                        CONFIRM RESONANCE
                    </button>
                </div>
            </div>
        );
    }

    return (
        <KarenGameMode
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
