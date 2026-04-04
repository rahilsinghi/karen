"use client";

import { Suspense, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { StonePanel } from "@/components/StonePanel";
import { KarenBossCard } from "@/components/KarenBossCard";
import { EscalationTower } from "@/components/EscalationTower";
import { CommentaryLog } from "@/components/CommentaryLog";
import { RitualButton } from "@/components/RitualButton";
import { buildCommentaryFeed } from "@/lib/fortress-data";
import { useEscalationContext } from "@/contexts/EscalationContext";
import { LevelTimeline } from "@/components/LevelTimeline";
import { motion, AnimatePresence } from "framer-motion";
import ResearchAnimation from "@/components/ResearchAnimation";

function EscalationPageInner({ id }: { id: string }) {
  const { escalation, events, connected, isComplete, continueAnyway, resolve, confirmPayment, audioEnabled, setAudioEnabled } = useEscalationContext();
  const router = useRouter();

  // Derive current level from events as primary source (always up-to-date),
  // fall back to escalation object (requires fetch roundtrip)
  const currentLevel = useMemo(() => {
    let maxLevel = 0;
    for (const e of events) {
      if ((e.type === "level_start" || e.type === "level_complete") && e.level > maxLevel) {
        maxLevel = e.level;
      }
    }
    return maxLevel || (escalation?.current_level ?? 1);
  }, [events, escalation?.current_level]);
  const commentary = useMemo(() => buildCommentaryFeed(events, escalation), [events, escalation]);
  const nextCharge = `${Math.max(1, 11 - currentLevel)} pulses`;
  const responseDetected = events.some((event) => event.type === "response_detected");
  const paymentDetected = events.some((event) => event.type === "payment_detected");
  const researchEvents = events.filter((e) => e.type === "research_step" || e.type === "research_discovery");
  const fedexEvents = events.filter((e) => e.type === "fedex_rate");
  const deescalationEvents = events.filter((e) => e.type === "deescalation_step");
  const isResolved = escalation?.status === "resolved";

  const bottomZone = (
    <div className="grid gap-4 md:grid-cols-3">
      <RitualButton
        label="CONTINUE ANYWAY"
        subtitle="IGNORE THEIR EXCUSES"
        variant="arcane"
        onClick={() => void continueAnyway()}
        disabled={!escalation || escalation.status === "resolved"}
      />
      <RitualButton
        label="RESOLVE MATTER"
        subtitle="BEGIN DE-ESCALATION RITE"
        variant="stone"
        onClick={() => void resolve()}
        disabled={!escalation}
      />
      <RitualButton
        label="PAYMENT DETECTED"
        subtitle="CONFIRM OFFERING"
        variant="primary"
        onClick={() => void confirmPayment(escalation?.amount ?? 1, escalation?.target.name ?? "target")}
        disabled={!escalation}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg overflow-hidden select-none">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none stone-brick-wall-dark" />

      {/* Header Strip */}
      <header className="relative z-10 flex h-14 items-center justify-between border-b-4 border-border bg-[#19161d]/95 px-6">
        <div className="flex items-center gap-4">
          <div className="pixel-text type-glow text-[1.4rem] text-fortress-ember">KAREN</div>
          <div className="hidden border-l-2 border-stone-800 pl-4 font-mono text-[0.8rem] uppercase tracking-widest text-[#e7946b] md:block">
            {id.slice(0, 8)} // {escalation?.target.name.toUpperCase() ?? "BINDING"}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <div className="pixel-text text-[0.5rem] text-muted">THREAT LEVEL</div>
            <div className={`pixel-text text-[0.9rem] ${currentLevel >= 9 ? "text-level-nuclear animate-pulse" : currentLevel >= 7 ? "text-level-red" : "text-level-green"}`}>
              {currentLevel}/10
            </div>
          </div>
          <RitualButton
            label="EXIT"
            variant="stone"
            className="h-10 px-4 scale-75 origin-right"
            onClick={() => router.push("/")}
          />
        </div>
      </header>

      {/* Notification Bar Zone */}
      <AnimatePresence>
        {responseDetected && !isResolved && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="relative z-20 border-b-4 border-border bg-[#064e3b] px-6 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="pixel-text text-[0.7rem] text-[#10b981]">
                💬 COUNTER-MESSAGE DETECTED // KAREN IS HOLDING FIRE.
              </div>
              <div className="flex gap-4">
                <button className="mc-button h-8 px-4 text-[0.6rem] mc-font-pixel bg-[#065f46]" onClick={() => void resolve()}>NEUTRALIZE</button>
                <button className="mc-button h-8 px-4 text-[0.6rem] mc-font-pixel bg-[#dc2626]" onClick={() => void continueAnyway()}>EXECUTE</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Immersive Stage */}
      <div className="relative flex-1 grid grid-cols-[380px_1fr_380px] p-4 gap-4 overflow-hidden">

        {/* Left Sidebar: Timeline */}
        <aside className="relative flex flex-col gap-4 overflow-hidden">
          <div className="fortress-panel flex-1 flex flex-col min-h-0 bg-[#16141a]/80 p-4 border-r-4">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <LevelTimeline events={events} currentLevel={currentLevel} />
            </div>
          </div>
        </aside>

        {/* Center: The Tower */}
        <main className={`relative flex flex-col items-center justify-center min-h-0 ${currentLevel >= 8 ? "threat-shake" : ""}`}>
          <div className="w-full max-w-lg h-full flex flex-col justify-center gap-6">
            <EscalationTower currentLevel={currentLevel} />

            {researchEvents.length > 0 && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <StonePanel title="INTEL GATHERED" eyebrow="OSINT">
                  <ResearchAnimation events={events} />
                </StonePanel>
              </motion.div>
            )}
          </div>
        </main>

        {/* Right Sidebar: Karen Presence */}
        <aside className="relative flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <KarenBossCard
              escalation={escalation}
              events={events}
              status={connected ? "AWAKE" : "LISTENING"}
            />

            {commentary.length > 0 && (
              <CommentaryLog lines={commentary} />
            )}

            <StonePanel title="THREAT CENSUS" eyebrow="DATA" className="shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="fortress-panel p-2 bg-black/40">
                  <div className="pixel-text text-[0.45rem] text-muted uppercase">MESSAGES</div>
                  <div className="pixel-text text-[1rem] text-text">{escalation?.messages_sent ?? 0}</div>
                </div>
                <div className="fortress-panel p-2 bg-black/40">
                  <div className="pixel-text text-[0.45rem] text-muted uppercase">CHANNELS</div>
                  <div className="pixel-text text-[1rem] text-text">{escalation?.channels_used.length ?? 0}</div>
                </div>
              </div>
            </StonePanel>

            {fedexEvents.length > 0 && (
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <StonePanel title="FEDEX NUCLEAR QUOTE" eyebrow="LOGISTICS">
                  {fedexEvents.map((e, idx) => e.type === "fedex_rate" && (
                    <div key={idx} className="fortress-panel p-3 bg-[#2a1a0a] border-[#f59e0b]">
                      <div className="pixel-text text-[0.55rem] text-[#f59e0b]">{e.service.toUpperCase()}</div>
                      <div className="mt-1 font-mono text-[1.2rem] text-[#fbbf24] tracking-tight">${e.rate}</div>
                    </div>
                  ))}
                </StonePanel>
              </motion.div>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom Operator Deck */}
      <div className="relative z-10 h-24 border-t-4 border-border bg-[#19161d] px-6 py-4">
        <div className="flex h-full items-center justify-between gap-8 max-w-[1400px] mx-auto">
          <div className="hidden xl:flex flex-col gap-1 w-64">
            <div className="pixel-text text-[0.5rem] text-muted">OPERATOR STATUS</div>
            <div className="font-mono text-[0.8rem] text-stone-400 truncate uppercase">
              {isResolved ? "MISSION COMPLETE // DEBT CLEARED" : "ESCALATION IN PROGRESS // NO COMPLIANCE"}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-4 h-full">
            <RitualButton
              label="CONTINUE ANYWAY"
              subtitle="IGNORE EXCUSES"
              className="h-full"
              onClick={() => void continueAnyway()}
              disabled={!escalation || isResolved}
            />
            <RitualButton
              label="RESOLVE MATTER"
              subtitle="BEGIN REVERSAL"
              className="h-full"
              variant="stone"
              onClick={() => void resolve()}
              disabled={!escalation || isResolved}
            />
            <button
              onClick={() => router.push(`/escalation/${id}/game`)}
              className="mc-button h-full mc-font-pixel text-[0.65rem] bg-indigo-900 border-[#4338ca] hover:bg-indigo-800"
            >
              <div className="flex flex-col items-center">
                <span>GAMIFIED VIEW</span>
                <span className="opacity-50 mt-1">COMMANDER INTERFACE</span>
              </div>
            </button>
          </div>

          <div className="hidden lg:block w-48 text-right">
            <div className="pixel-text text-[0.5rem] text-muted">SYSTEM TIME</div>
            <div className="font-mono text-[1rem] text-text">
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Gate Overlay */}
      {!audioEnabled && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="mc-container max-w-sm p-8 text-center bg-[#c6c6c6] shadow-xl border-4 border-stone-800">
            <div className="mb-4 flex justify-center">
              <motion.span
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-5xl"
              >
                🔊
              </motion.span>
            </div>
            <h2 className="mc-font-pixel text-2xl mb-4 text-black">ENABLE MISSION AUDIO</h2>
            <p className="mc-font-game text-[1rem] mb-8 text-[#3f3f3f] leading-relaxed uppercase">
              THE FORTRESS REQUIRES SONIC RESONANCE TO OPERATE AT FULL CAPACITY.
            </p>
            <button
              onClick={() => setAudioEnabled(true)}
              className="mc-button w-full h-16 mc-font-pixel text-sm bg-green-700 active:bg-green-800"
            >
              ESTABLISH RESONANCE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EscalationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense>
      <EscalationPageInner id={id} />
    </Suspense>
  );
}
