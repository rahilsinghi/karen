import { motion } from "framer-motion";
import { TypewriterText } from "@/components/KarenBossCard";

export function CommentaryLog({ lines }: { lines: string[] }) {
  return (
    <div className="fortress-panel h-full p-4">
      <div className="pixel-text text-[0.7rem] text-muted">COMMENTARY CHAMBER</div>
      <div className="mt-3 space-y-3">
        {lines.slice(-6).reverse().map((line, idx) => (
          <motion.div
            key={`${line}-${idx}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="border-l-4 border-fortress-pink pl-3 font-mono text-[1rem] uppercase text-text"
          >
            <TypewriterText text={line} speed={30} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
