import React from "react";
import { TowerChamber } from "./TowerChamber";
import type { ChamberState } from "@/hooks/useEventGameState";
import { motion } from "framer-motion";

interface EscalationTowerSceneProps {
    chambers: ChamberState[];
    currentLevel: number;
}

export const EscalationTowerScene: React.FC<EscalationTowerSceneProps> = ({ chambers, currentLevel }) => {
    return (
        <div className="relative flex flex-col-reverse gap-2 w-full max-w-md mx-auto p-4 bg-[#0c0a09] border-[12px] border-[#44403c] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Background Corruption / Circuitry */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: "linear-gradient(rgba(147, 51, 234, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(147, 51, 234, 0.2) 2px, transparent 2px)", backgroundSize: "32px 32px" }} />

            {/* The Chambers */}
            {chambers.map((chamber) => (
                <TowerChamber key={chamber.level} chamber={chamber} />
            ))}

            {/* Tower Foundation */}
            <div className="h-12 w-full bg-[#1c1917] border-t-8 border-black flex items-center justify-center">
                <div className="flex gap-4">
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.5 }}
                            className="w-4 h-4 bg-red-600 border-2 border-black rotate-45"
                        />
                    ))}
                </div>
            </div>

            {/* Side Support Structure */}
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#292524] border-r-2 border-black" />
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-[#292524] border-l-2 border-black" />
        </div>
    );
};
