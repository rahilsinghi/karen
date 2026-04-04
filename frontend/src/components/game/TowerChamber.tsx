import React from "react";
import { motion } from "framer-motion";
import type { ChamberState } from "@/hooks/useEventGameState";

interface TowerChamberProps {
    chamber: ChamberState;
}

export const TowerChamber: React.FC<TowerChamberProps> = ({ chamber }) => {
    const isActive = chamber.status === "active";
    const isConquered = chamber.status === "conquered";
    const isSkipped = chamber.status === "skipped";

    return (
        <motion.div
            initial={false}
            animate={{
                scale: isActive ? 1.05 : 1,
                filter: isSkipped ? "grayscale(1) opacity(0.5)" : "none",
            }}
            className={`relative w-full border-4 border-black p-4 transition-all duration-500 ${isActive
                ? "bg-[#7e22ce] shadow-[0_0_20px_#9333ea]"
                : isConquered
                    ? "bg-[#1e1b4b] border-[#4338ca]"
                    : "bg-[#292524]"
                }`}
            style={{
                imageRendering: "pixelated",
            }}
        >
            {/* Blocky Texture/Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: "linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)", backgroundSize: "8px 8px" }} />

            <div className="relative z-10 flex items-center justify-between">
                <div className="flex flex-col">
                    <div className={`mc-font-pixel text-[0.6rem] mb-1 ${isActive ? "text-yellow-400" : "text-gray-400"}`}>
                        LEVEL {chamber.level}
                    </div>
                    <div className={`mc-font-game text-lg font-bold uppercase ${isActive ? "text-white" : isConquered ? "text-indigo-300" : "text-gray-500"}`}>
                        {chamber.name}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isActive && (
                        <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        opacity: [0.2, 1, 0.2],
                                        scale: [0.8, 1.2, 0.8]
                                    }}
                                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                                    className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]"
                                />
                            ))}
                        </div>
                    )}
                    {isActive && (
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="px-2 py-1 bg-red-600 border-2 border-black text-[0.5rem] text-white mc-font-pixel"
                        >
                            ACTIVE
                        </motion.div>
                    )}
                    {isConquered && (
                        <div className="w-8 h-8 flex items-center justify-center bg-green-600 border-2 border-black text-sm text-white mc-font-pixel shadow-[0_0_10px_rgba(22,163,74,0.5)]">
                            ✓
                        </div>
                    )}
                    {isSkipped && (
                        <div className="w-8 h-8 flex items-center justify-center bg-gray-600 border-2 border-black text-sm text-white mc-font-pixel">
                            ×
                        </div>
                    )}
                </div>
            </div>

            {isActive && chamber.channel && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className="mt-2 h-1 bg-yellow-400 shadow-[0_0_5px_#facc15]"
                />
            )}
        </motion.div>
    );
};
