import React from "react";
import { motion } from "framer-motion";

interface ChannelArtifactProps {
    x: number;
    y: number;
    channel: string;
    consumed: boolean;
    skipped: boolean;
}

const ARTIFACT_ICONS: Record<string, string> = {
    email: "📜",
    sms: "📱",
    whatsapp: "💬",
    voice: "📞",
    call: "📞",
    phone: "📞",
    linkedin: "💼",
    calendar: "⏳",
    discord: "🚨",
    open_matters: "📖",
    twitter: "🐦",
    fedex: "📦",
};

const ARTIFACT_LABELS: Record<string, string> = {
    email: "Email Scroll",
    sms: "SMS Rune",
    whatsapp: "WhatsApp Orb",
    voice: "Phone Call",
    call: "Phone Call",
    phone: "Phone Call",
    linkedin: "Cursed Briefcase",
    calendar: "Chronos Sigil",
    discord: "Siren Beacon",
    open_matters: "Public Ledger",
    twitter: "Chaos Bird",
    fedex: "Doom Crate",
};

export const ChannelArtifact: React.FC<ChannelArtifactProps> = ({ x, y, channel, consumed, skipped }) => {
    if (consumed) return null;

    const icon = ARTIFACT_ICONS[channel.toLowerCase()] || "❓";
    const label = ARTIFACT_LABELS[channel.toLowerCase()] || channel;

    return (
        <motion.div
            className="absolute w-16 h-16 -ml-8 -mt-8 flex flex-col items-center justify-center z-15"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
                left: `${x}%`,
                top: `${y}%`,
                scale: skipped ? 0.8 : [1, 1.1, 1],
                opacity: skipped ? 0.5 : 1
            }}
            transition={{
                scale: {
                    repeat: skipped ? 0 : Infinity,
                    duration: 1.5,
                    ease: "easeInOut"
                }
            }}
        >
            {/* Artifact Aura */}
            <div className={`absolute inset-0 rounded-full blur-md ${skipped ? "bg-gray-500" : "bg-purple-500/30"} ${!skipped ? "animate-pulse" : ""}`} />

            {/* Icon */}
            <div className="text-4xl relative z-10">
                {icon}
            </div>

            {/* Label */}
            <div className="absolute -bottom-4 text-[0.4rem] uppercase font-bold text-purple-300 drop-shadow-md whitespace-nowrap">
                {label}
            </div>

            {/* Caged Effect for skipped */}
            {skipped && (
                <div className="absolute inset-0 border-4 border-slate-700/80 rounded flex items-center justify-center">
                    <div className="text-xl">⛓️</div>
                </div>
            )}
        </motion.div>
    );
};
