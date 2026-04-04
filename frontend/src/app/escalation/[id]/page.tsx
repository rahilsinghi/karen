"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { EscalationTower } from "@/components/EscalationTower";
import { CommentaryLog } from "@/components/CommentaryLog";
import { RitualButton } from "@/components/RitualButton";
import { ThreatBadge } from "@/components/ThreatBadge";
import { buildCommentaryFeed, levelTone } from "@/lib/fortress-data";
import { useEscalation } from "@/hooks/useEscalation";
import { useKarenAudio } from "@/hooks/useKarenAudio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import { LevelTimeline } from "@/components/LevelTimeline";
import { motion, AnimatePresence } from "framer-motion";
import ResearchAnimation from "@/components/ResearchAnimation";

function EscalationPageInner({ id }: { id: string }) {
  const { escalation, events, connected, continueAnyway, resolve, confirmPayment } = useEscalation(id);
  const router = useRouter();
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { start, stop, setLevel, duck, unduck } = useBackgroundMusic();

  // Audio Hooks
  useKarenAudio(events, {
    enabled: audioEnabled,
    onPlayStart: duck,
    onPlayEnd: unduck,
  });

  useEffect(() => {
    if (audioEnabled) {
      void start();
    } else {
      stop();
    }
  }, [audioEnabled, start, stop]);

  useEffect(() => {
    if (audioEnabled) {
      setLevel(escalation?.current_level ?? 1);
    }
  }, [audioEnabled, escalation?.current_level, setLevel]);

  const currentLevel = escalation?.current_level ?? 1;
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
    <>
      <AnimatePresence>
        {responseDetected && !isResolved && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b-4 border-border bg-[#064e3b] px-6 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="pixel-text text-[0.8rem] text-[#10b981]">
                💬 COUNTER-MESSAGE DETECTED // KAREN IS HOLDING FIRE.
              </div>
              <div className="flex gap-4">
                <RitualButton label="NEUTRALIZE" variant="stone" className="h-10 px-4" onClick={() => void resolve()} />
                <RitualButton label="EXECUTE" variant="danger" className="h-10 px-4" onClick={() => void continueAnyway()} />
              </div>
            </div>
          </motion.div>
        )}
        {paymentDetected && !isResolved && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b-4 border-border bg-[#78350f] px-6 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="pixel-text text-[0.8rem] text-[#f59e0b]">
                💰 PAYMENT INTERCEPTED // AWAITING OPERATOR COMMAND.
              </div>
              <RitualButton label="DE-ESCALATE" variant="primary" className="h-10 px-4" onClick={() => void resolve()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!audioEnabled && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="fortress-panel max-w-xl p-6 text-center">
            <div className="pixel-text text-[1.2rem] text-fortress-pink">ENABLE KAREN&apos;S VOICE</div>
            <p className="mt-4 font-mono text-[1.1rem] uppercase text-text">
              Permit the fortress to speak aloud during the climb.
            </p>
            <RitualButton
              label="UNSEAL THE VOICE GATE"
              subtitle="CONFIRM AUDIO"
              variant="primary"
              className="mt-6 w-full"
              onClick={() => setAudioEnabled(true)}
            />
          </div>
        </div>
      )}

      <FortressLayout
        title="LIVE ESCALATION // FORTRESS LADDER"
        subtitle="COMMAND CENTER OF MALICE"
        rightSidebar={
          <div className="flex flex-col gap-4">
            <OpenClawCoreCard escalation={escalation} events={events} status={connected ? "AWAKE" : "LISTENING"} />
            <RitualButton
              label="ENTER GAME MODE"
              subtitle="COMMANDER VIEW"
              variant="primary"
              onClick={() => router.push(`/escalation/${id}/game`)}
            />
          </div>
        }
        bottomZone={bottomZone}
        topStats={[
          { label: "TARGET", value: escalation?.target.name.toUpperCase() ?? "BINDING" },
          { label: "LEVEL", value: `${currentLevel}/10` },
          { label: "THREAT STATE", value: escalation?.status.toUpperCase() ?? "ACTIVE" },
        ]}
      >
        <div className={`grid gap-4 xl:grid-cols-[0.9fr_1.2fr_0.9fr] ${currentLevel >= 8 ? "threat-shake" : ""}`}>

          <div className="flex flex-col gap-4">
            <StonePanel title="TARGET DOSSIER" eyebrow="BOSS FIGHT HEADER">
              <div className="space-y-3 font-mono text-[1rem] uppercase">
                <div>{escalation?.grievance_detail ?? "Loading chamber..."}</div>
                <div className="flex flex-wrap gap-2">
                  <ThreatBadge
                    label={levelTone(currentLevel)}
                    tone={currentLevel <= 2 ? "green" : currentLevel <= 4 ? "yellow" : currentLevel <= 6 ? "orange" : currentLevel <= 8 ? "red" : currentLevel === 9 ? "purple" : "pink"}
                  />
                  <ThreatBadge
                    label={responseDetected ? "RESPONSE DETECTED" : "NO RESPONSE"}
                    tone={responseDetected ? "green" : "red"}
                  />
                  <ThreatBadge
                    label={paymentDetected ? "PAYMENT DETECTED" : "NO PAYMENT"}
                    tone={paymentDetected ? "green" : "orange"}
                  />
                </div>
              </div>
            </StonePanel>

            <LevelTimeline events={events} currentLevel={currentLevel} />

            {researchEvents.length > 0 && (
              <StonePanel title="OSINT MODULE" eyebrow="KAREN RESEARCH">
                <ResearchAnimation events={events} />
              </StonePanel>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <EscalationTower currentLevel={currentLevel} />
            {commentary.length > 0 && (
              <CommentaryLog lines={commentary} />
            )}
          </div>

          <div className="grid gap-4">
            <StonePanel title="THREAT CENSUS" eyebrow="COUNTERS">
              <div className="grid grid-cols-2 gap-3">
                <div className="fortress-panel p-3">
                  <div className="pixel-text text-[0.55rem] text-muted">MESSAGES</div>
                  <div className="pixel-text mt-1 text-[1.2rem] text-text">{escalation?.messages_sent ?? 0}</div>
                </div>
                <div className="fortress-panel p-3">
                  <div className="pixel-text text-[0.55rem] text-muted">CHANNELS</div>
                  <div className="pixel-text mt-1 text-[1.2rem] text-text">{escalation?.channels_used.length ?? 0}</div>
                </div>
                <div className="fortress-panel col-span-2 p-3">
                  <div className="pixel-text text-[0.55rem] text-muted">DE-ESCALATION SEQUENCE</div>
                  <div className="mt-2 font-mono text-[1rem] uppercase text-text">
                    {escalation?.status === "resolved" ? "Matter sealed. Torches dimming." : "Awaiting compliance or tribute."}
                  </div>
                </div>
              </div>
            </StonePanel>

            {deescalationEvents.length > 0 && (
              <StonePanel title="DE-ESCALATION LOG" eyebrow="RITUAL REVERSAL">
                <div className="space-y-2">
                  {deescalationEvents.map((e, idx) => {
                    if (e.type !== "deescalation_step") return null;
                    const ok = e.status === "ok";
                    return (
                      <div key={idx} className={`border-l-4 pl-3 ${ok ? "border-green-500" : "border-red-500"}`}>
                        <div className="font-mono text-[0.9rem] uppercase text-text">{e.action}</div>
                        {e.karen_note && <div className="font-mono text-[0.7rem] text-muted italic">{e.karen_note}</div>}
                      </div>
                    );
                  })}
                </div>
              </StonePanel>
            )}

            {fedexEvents.length > 0 && (
              <StonePanel title="LOGISTICS QUOTE" eyebrow="NUCLEAR OPTION DATA">
                {fedexEvents.map((e, idx) => {
                  if (e.type !== "fedex_rate") return null;
                  return (
                    <div key={idx} className="fortress-panel p-3 bg-[#2a1a0a] border-[#f59e0b]">
                      <div className="pixel-text text-[0.6rem] text-[#f59e0b]">{e.service.toUpperCase()}</div>
                      <div className="mt-1 font-mono text-[1.4rem] text-[#fbbf24]">${e.rate}</div>
                      <div className="mt-1 font-mono text-[0.8rem] text-muted">{e.destination}</div>
                    </div>
                  );
                })}
              </StonePanel>
            )}

            <StonePanel title="CHANNEL ARTIFACTS" eyebrow="ACTIVE LOADOUT">
              <div className="grid gap-2">
                {(escalation?.channels_used.length ? escalation.channels_used : ["email", "sms", "fedex"]).map((channel) => (
                  <div key={channel} className="border-4 border-border bg-[#1b151e] px-3 py-3 pixel-text text-[0.68rem] text-fortress-pink">
                    {channel.replaceAll("_", " ")}
                  </div>
                ))}
              </div>
            </StonePanel>
          </div>
        </div>
      </FortressLayout>
    </>
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
