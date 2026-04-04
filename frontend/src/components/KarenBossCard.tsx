"use client";
import { useEffect, useState } from "react";
import type { Escalation, KarenEvent } from "@/lib/types";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";

export function KarenBossCard({
    escalation,
    events = [],
    status,
}: {
    escalation?: Escalation | null;
    events?: KarenEvent[];
    status?: string;
    commentary?: string[] | string;
}) {
    const normalizedEvents = events;
    const normalizedStatus = status ?? "AWAKE";

    return (
        <OpenClawCoreCard
            escalation={escalation}
            events={normalizedEvents}
            status={normalizedStatus}
        />
    );
}

export function TypewriterText({ text, speed = 30, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
    const [displayed, setDisplayed] = useState("");
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        setDisplayed("");
        setIsTyping(true);
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.slice(0, i + 1));
            i++;
            if (i >= text.length) {
                clearInterval(timer);
                setIsTyping(false);
                onComplete?.();
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed, onComplete]);

    return (
        <span>
            {displayed}
            {isTyping && <span className="animate-pulse ml-1 text-fortress-pink">▌</span>}
        </span>
    );
}
