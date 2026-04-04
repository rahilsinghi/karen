import React from "react";
import { motion } from "framer-motion";
import { AnimationState } from "@/hooks/useArenaGameLoop";

interface TargetSpriteProps {
    x: number;
    y: number;
    state: AnimationState;
    name: string;
}

export const TargetSprite: React.FC<TargetSpriteProps> = ({ x, y, state, name }) => {
    return (
        <motion.div
            className="absolute w-24 h-24 -ml-12 -mt-12 z-10"
            animate={{
                left: `${x}%`,
                top: `${y}%`,
                x: state === "hit" ? [0, -10, 10, -10, 10, 0] : 0,
                scale: state === "hit" ? [1, 1.2, 1] : 1,
                opacity: state === "deescalate" ? 0.7 : 1
            }}
            transition={{
                left: { type: "tween", duration: 0.5, ease: "linear" },
                top: { type: "tween", duration: 0.5, ease: "linear" },
                x: { duration: 0.4 }
            }}
        >
            <div className="relative w-full h-full flex flex-col items-center">
                {/* Target Name Tag */}
                <div className="absolute -top-4 bg-black/80 px-2 py-0.5 rounded text-[0.55rem] uppercase border border-white/20 whitespace-nowrap z-20 font-bold text-yellow-500 shadow-lg">
                    {name}
                </div>

                {/* Terrified Blue Crab Image */}
                <div className="relative w-full h-full">
                    <img
                        src="/terrified_blue_crab.png"
                        alt="Terrified Target"
                        className={`w-full h-full object-contain image-rendering-pixelated ${state === "hit" ? "brightness-150 sepia-[.5] hue-rotate-[300deg]" : ""}`}
                    />

                    {/* Floating Distress Emotes */}
                    {state === "run" && (
                        <motion.div
                            animate={{ y: [-20, -60], opacity: [1, 0], scale: [0.5, 1.5] }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "easeOut" }}
                            className="absolute top-0 left-1/2 -translate-x-1/2 text-2xl z-30"
                        >
                            {["😰", "😱", "🏃‍♂️", "❗", "🆘", "💀"][Math.floor(Math.random() * 6)]}
                        </motion.div>
                    )}

                    {/* White Flag Overlay */}
                    {(state === "idle" || state === "deescalate") && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -right-2 -top-2 text-3xl z-40"
                        >
                            🏳️
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
