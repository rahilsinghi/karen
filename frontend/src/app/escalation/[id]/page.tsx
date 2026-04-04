"use client";

import { use, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEscalation } from "@/hooks/useEscalation";
import { useCircle } from "@/hooks/useCircle";
import { EscalationTower } from "@/components/EscalationTower";
import { KarenBossCard } from "@/components/KarenBossCard";
import {
  PERSONALITY_LABELS,
  getLevelColorClass,
} from "@/lib/constants";
import { useKarenAudio } from "@/hooks/useKarenAudio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

function EscalationPageInner({ id }: { id: string }) {
  const { events, escalation, connected, continueAnyway, resolve, confirmPayment } =
    useEscalation(id);
  const { members } = useCircle();
  const [paymentPending, setPaymentPending] = useState(false);

  // --- Audio ---
  const [audioEnabled, setAudioEnabled] = useState(false);
  const music = useBackgroundMusic();

  useKarenAudio(audioEnabled ? events : [], {
    onPlayStart: music.duck,
    onPlayEnd: music.unduck,
  });

  const musicStartedRef = useRef(false);

  useEffect(() => {
    if (!audioEnabled) return;

    if (!musicStartedRef.current && escalation && escalation.status !== "resolved") {
      music.start();
      musicStartedRef.current = true;
      if (escalation.current_level > 0) {
        music.setLevel(escalation.current_level);
      }
    }

    const lastEvent = events[events.length - 1];
    if (lastEvent) {
      if (lastEvent.type === "level_start") {
        music.setLevel(lastEvent.level);
      } else if (lastEvent.type === "complete") {
        music.stop();
        musicStartedRef.current = false;
      }
    }
  }, [events, audioEnabled, escalation, music]);

  const target = useMemo(
    () => members.find((m) => m.id === escalation?.target.id),
    [members, escalation]
  );

  const currentLevel = escalation?.current_level ?? 1;
  const isResolved = escalation?.status === "resolved";
  const isResponseDetected = events.some((e) => e.type === "response_detected");
  const isPaymentDetected = events.some((e) => e.type === "payment_detected");

  if (!escalation) {
    return (
      <div className="h-screen flex items-center justify-center bg-black redstone-circuit">
        <div className="font-display text-4xl text-red-600 animate-pulse uppercase tracking-[0.2em]">
          INITIATING FORTRESS...
        </div>
      </div>
    );
  }

  // Screen shake logic for high levels
  const shakeIntensity = currentLevel >= 8 ? currentLevel - 7 : 0;

  return (
    <motion.div
      initial={false}
      animate={shakeIntensity > 0 ? {
        x: [0, -shakeIntensity, shakeIntensity, -shakeIntensity, 0],
        y: [0, shakeIntensity, -shakeIntensity, shakeIntensity, 0],
      } : {}}
      transition={shakeIntensity > 0 ? {
        duration: 0.1,
        repeat: Infinity,
      } : {}}
      className="fixed inset-0 bg-black text-white flex flex-col font-mono overflow-hidden"
    >
      {/* Audio autoplay gate */}
      <AnimatePresence>
        {!audioEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <button
              onClick={() => setAudioEnabled(true)}
              className="pixel-border-stone bg-red-700 text-white font-display text-2xl px-10 py-6 hover:bg-red-600 transition-all active:translate-y-1 shadow-[0_8px_0_0_#900] active:shadow-none uppercase text-shadow-pixel"
            >
              ENABLE KAREN'S FURY 🔊
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- TOP HUD: TARGET INFO --- */}
      <div className="h-24 border-b-4 border-stone-800 bg-stone-900/90 flex items-center px-12 relative z-50">
        <div className="flex-1 flex items-center gap-8">
          <div className="pixel-border-stone bg-stone-900 p-2 flex items-center gap-2">
            <span className="text-3xl animate-pulse">🎯</span>
            <div>
              <span className="block font-mono text-[8px] text-red-500 font-bold uppercase">TARGET_ID</span>
              <span className="font-display text-xl font-bold uppercase text-stone-200">
                {target?.name ?? escalation.target.name}
              </span>
            </div>
          </div>

          <div className="h-12 w-px bg-stone-800" />

          <div>
            <span className="block font-mono text-[8px] text-stone-500 font-bold uppercase mb-1">GRIEVANCE_PARAMETER</span>
            <span className="font-mono text-sm text-stone-300 font-bold uppercase tracking-tight">
              {escalation.grievance_detail}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-red-900 font-bold uppercase tracking-widest">THREAT_STATUS:</span>
            <span className={`font-display text-2xl font-bold uppercase ${currentLevel === 10 ? 'text-pink-500 animate-pulse' : 'text-red-600'}`}>
              {isResolved ? "NEUTRALIZED" : escalation.status.toUpperCase()}
            </span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={`w-12 h-1 ${i < currentLevel / 2 ? 'bg-red-600' : 'bg-stone-800'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Action Banners */}
      <AnimatePresence>
        {isResponseDetected && !isResolved && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-green-950/30 border-b-2 border-green-900 px-12 py-3 flex items-center justify-between z-40"
          >
            <p className="font-mono text-sm text-green-400 font-bold uppercase">
              💬 COUNTER-MESSAGE DETECTED. KAREN IS HOLDING FIRE.
            </p>
            <div className="flex gap-4">
              <button onClick={resolve} className="pixel-border-stone bg-green-700 text-white text-xs px-4 py-1 uppercase font-bold">NEUTRALIZE</button>
              <button onClick={continueAnyway} className="pixel-border-stone bg-red-700 text-white text-xs px-4 py-1 uppercase font-bold">EXECUTE</button>
            </div>
          </motion.div>
        )}
        {isPaymentDetected && !isResolved && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-yellow-950/30 border-b-2 border-yellow-900 px-12 py-3 flex items-center justify-between z-40"
          >
            <p className="font-mono text-sm text-yellow-400 font-bold uppercase">
              💰 PAYMENT INTERCEPTED. AWAITING OPERATOR COMMAND.
            </p>
            <button onClick={resolve} className="pixel-border-stone bg-yellow-700 text-white text-xs px-4 py-1 uppercase font-bold">INITIATE DE-ESCALATION</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CENTER HERO AREA: THE TOWER --- */}
      <main className="flex-1 flex px-12 py-8 gap-12 overflow-hidden relative">
        <div className="absolute inset-0 redstone-circuit opacity-10 pointer-events-none" />

        {/* Left Side: System Readouts */}
        <div className="w-80 flex flex-col gap-6 relative z-10">
          <div className="boss-frame-obsidian p-6 flex flex-col gap-4">
            <h4 className="font-display text-sm text-stone-500 font-bold uppercase">MISSION_LOG</h4>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {events.slice(-5).map((e, idx) => (
                <div key={idx} className="border-l-2 border-red-900 pl-3">
                  <span className="block text-[8px] text-stone-600 font-mono italic">TIMESTAMP_{idx}</span>
                  <p className="text-[10px] text-stone-400 uppercase font-bold">
                    {e.type.replace('_', ' ')}: {e.level ? `PHASE ${e.level}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Deescalation Steps */}
          {events.some(e => e.type === "deescalation_step") && (
            <div className="boss-frame-obsidian p-6 flex flex-col gap-3">
              <h4 className="font-display text-sm text-green-600 font-bold uppercase">DE-ESCALATION SEQUENCE</h4>
              <div className="space-y-2">
                {events.filter(e => e.type === "deescalation_step").map((e, idx) => {
                  if (e.type !== "deescalation_step") return null;
                  const ok = e.status === "ok";
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-2 border-l-2 pl-3"
                      style={{ borderColor: ok ? "#16a34a" : "#dc2626" }}
                    >
                      <span className="text-sm">{ok ? "✓" : "✗"}</span>
                      <div>
                        <p className="font-mono text-[10px] text-stone-300 font-bold uppercase">{e.action}</p>
                        {e.karen_note && (
                          <p className="font-mono text-[9px] text-stone-500 italic">{e.karen_note}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="boss-frame-obsidian p-6">
            <h4 className="font-display text-sm text-stone-500 font-bold uppercase mb-4">COUNTERMEASURES</h4>
            <button
              onClick={resolve}
              disabled={isResolved}
              className="w-full h-16 pixel-border bg-stone-900 text-stone-500 hover:text-red-500 hover:border-red-500 transition-all font-display text-xl font-bold uppercase disabled:opacity-20"
            >
              NEUTRALIZE
            </button>
          </div>
        </div>

        {/* Center: The Escalation Tower */}
        <div className="flex-1 flex justify-center items-center">
          <div className="w-full max-w-[400px] h-[calc(100vh-280px)]">
            <EscalationTower currentLevel={currentLevel} />
          </div>
        </div>

        {/* Right Side: Karen Boss Presence */}
        <div className="w-96 relative z-10">
          <KarenBossCard commentary={(() => {
            const last = [...events].reverse().find(e => e.type === "commentary");
            return last?.type === "commentary" ? last.text : "ANALYZING TARGET VULNERABILITIES...";
          })()} />
        </div>
      </main>

      {/* --- BOTTOM HUD: THREAT METER & CONTROLS --- */}
      <div className="h-32 border-t-4 border-stone-800 bg-stone-900/95 flex items-center px-12 gap-8 relative z-50">
        <div className="flex-1">
          <div className="flex justify-between items-end mb-2">
            <span className="font-mono text-[10px] text-red-900 font-bold uppercase tracking-widest">ESCALATION_THREAT_METER</span>
            <span className="font-mono text-[10px] text-stone-500 font-bold">LEVEL_{currentLevel}_CAPACITY_ENGAGED</span>
          </div>
          <div className="h-10 bg-black pixel-border-stone overflow-hidden p-1">
            <motion.div
              initial={false}
              animate={{ width: `${(currentLevel / 10) * 100}%` }}
              className="threat-meter-red"
            />
          </div>
        </div>

        <div className="w-96 flex flex-col gap-2">
          <div className="flex justify-between font-mono text-[8px] text-stone-500 uppercase font-bold">
            <span>RITUAL_WINDUP</span>
            <span className="text-red-500">{connected ? 'STABLE' : 'UNSTABLE'}</span>
          </div>
          <button
            disabled={isResolved}
            className={`w-full h-16 pixel-border-red font-display text-3xl font-bold uppercase transition-all flex items-center justify-center gap-4 group ${isResolved ? 'bg-stone-900 text-stone-700 cursor-not-allowed' : 'bg-red-700 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(255,0,0,0.4)]'
              }`}
          >
            {isResolved ? "STRIKE COMPLETE" : (
              <>
                RELEASE KAREN <span className="group-hover:rotate-12 transition-transform">💀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function EscalationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense>
      <EscalationPageInner id={id} />
    </Suspense>
  );
}
