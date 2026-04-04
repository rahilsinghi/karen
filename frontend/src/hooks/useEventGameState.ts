import { useMemo } from "react";
import type { Escalation, KarenEvent } from "@/lib/types";

export interface ChamberState {
    level: number;
    name: string;
    status: "idle" | "active" | "conquered" | "skipped";
    channel?: string;
}

export const LEVEL_NAMES: Record<number, string> = {
    1: "Email Scroll Chamber",
    2: "SMS Rune Chamber",
    3: "WhatsApp Orb + Voice Skull Chamber",
    4: "Witness Summon Chamber",
    5: "LinkedIn Sigil Chamber",
    6: "Calendar Ritual Chamber",
    7: "Discord Siren Chamber",
    8: "Open Matters Ledger Chamber",
    9: "Twitter Chaos Chamber",
    10: "Nuclear FedEx Doom Chamber",
};

export function useEventGameState(events: KarenEvent[], escalation: Escalation | null) {
    const gameState = useMemo(() => {
        const chambers: ChamberState[] = Array.from({ length: 10 }, (_, i) => ({
            level: i + 1,
            name: LEVEL_NAMES[i + 1] || `Chamber ${i + 1}`,
            status: "idle",
        }));

        // Derive level from events (always up-to-date) with escalation as fallback
        let currentLevel = escalation?.current_level ?? 0;
        for (const e of events) {
            if ((e.type === "level_start" || e.type === "level_complete") && e.level > currentLevel) {
                currentLevel = e.level;
            }
        }
        let isVictory = escalation?.status === "resolved";
        let responseDetected = false;
        let paymentDetected = false;
        let deescalationActive = false;

        // Process events to update chamber states
        events.forEach((event) => {
            switch (event.type) {
                case "level_start":
                    if (chambers[event.level - 1]) {
                        chambers[event.level - 1].status = "active";
                        chambers[event.level - 1].channel = event.channel;
                    }
                    break;
                case "level_complete":
                    if (chambers[event.level - 1]) {
                        chambers[event.level - 1].status = "conquered";
                    }
                    break;
                case "level_skipped":
                    if (chambers[event.level - 1]) {
                        chambers[event.level - 1].status = "skipped";
                    }
                    break;
                case "response_detected":
                    responseDetected = true;
                    break;
                case "payment_detected":
                    paymentDetected = true;
                    break;
                case "deescalation_step":
                    deescalationActive = true;
                    break;
                case "complete":
                    isVictory = true;
                    break;
            }
        });

        // Ensure previous levels are marked correctly if missing events (e.g. on page load)
        chambers.forEach((chamber) => {
            if (chamber.level < currentLevel && chamber.status === "idle") {
                chamber.status = "conquered";
            }
            if (chamber.level === currentLevel && chamber.status === "idle") {
                chamber.status = "active";
            }
        });

        const lastCommentary = [...events]
            .reverse()
            .find((e) => e.type === "commentary" || (e.type === "audio" && e.text)) as Extract<KarenEvent, { type: "commentary" | "audio" }> | undefined;

        return {
            chambers,
            currentLevel,
            isVictory,
            responseDetected,
            paymentDetected,
            deescalationActive,
            lastCommentary: lastCommentary?.type === "commentary" ? lastCommentary.text : lastCommentary?.text,
            targetName: escalation?.target.name ?? "Target",
            grievance: escalation?.grievance_detail ?? "",
            status: escalation?.status ?? "active",
            id: escalation?.id ?? "",
        };
    }, [events, escalation]);

    return gameState;
}
