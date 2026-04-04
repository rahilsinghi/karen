import React from "react";
import { motion } from "framer-motion";

interface CrabPlayerProps {
    x: number;
    y: number;
    state: "idle" | "run" | "eat" | "charge" | "attack" | "hit" | "deescalate";
}

export const CrabPlayer: React.FC<CrabPlayerProps> = ({ x, y, state }) => {
    return (
        <motion.div
            className="absolute w-24 h-24 -ml-12 -mt-12 z-20"
            animate={{
                left: `${x}%`,
                top: `${y}%`,
                scale: state === "eat" ? [1, 1.2, 1] : 1,
                rotate: state === "run" ? [0, 5, -5, 0] : 0
            }}
            transition={{
                left: { type: "spring", stiffness: 100, damping: 20 },
                top: { type: "spring", stiffness: 100, damping: 20 },
                rotate: { repeat: Infinity, duration: 0.2, ease: "linear" }
            }}
        >
            {/* Crab Body (SVG) */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                {/* Pincers */}
                <motion.path
                    d="M20,40 Q10,20 30,10 L40,30"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="6"
                    animate={{ rotate: state === "charge" ? [0, -20, 0] : 0 }}
                />
                <motion.path
                    d="M80,40 Q90,20 70,10 L60,30"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="6"
                    animate={{ rotate: state === "charge" ? [0, 20, 0] : 0 }}
                />

                {/* Body */}
                <circle cx="50" cy="60" r="30" fill="#991b1b" />
                <path d="M25,50 Q50,40 75,50" fill="none" stroke="#ef4444" strokeWidth="4" />

                {/* Eyes */}
                <circle cx="40" cy="55" r="5" fill="white" />
                <circle cx="60" cy="55" r="5" fill="white" />
                <circle cx="40" cy="55" r="2" fill="black" />
                <circle cx="60" cy="55" r="2" fill="black" />

                {/* Legs */}
                <path d="M20,70 L10,80" stroke="#ef4444" strokeWidth="4" />
                <path d="M30,85 L25,95" stroke="#ef4444" strokeWidth="4" />
                <path d="M70,85 L75,95" stroke="#ef4444" strokeWidth="4" />
                <path d="M80,70 L90,80" stroke="#ef4444" strokeWidth="4" />

                {/* Attack Glow */}
                {state === "charge" && (
                    <motion.circle
                        cx="50" cy="40" r="10"
                        fill="#ef4444"
                        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                    />
                )}
            </svg>

            {/* Speech Bubble */}
            {state === "idle" && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black px-3 py-1 rounded-full text-[0.6rem] font-bold border-2 border-black whitespace-nowrap">
                    CRAB CORE ONLINE
                </div>
            )}
        </motion.div>
    );
};
