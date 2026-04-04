"use client";

import { Suspense, use, useEffect, useMemo, useState } from "react";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { EscalationTower } from "@/components/EscalationTower";
import { CommentaryLog } from "@/components/CommentaryLog";
import { RitualButton } from "@/components/RitualButton";
import { ThreatBadge } from "@/components/ThreatBadge";
import { buildCommentaryFeed, levelTone } from "@/lib/fortress-data";
import { useEscalation } from "@/hooks/useEscalation";

function EscalationPageInner({ id }: { id: string }) {
  const { escalation, events, connected, continueAnyway, resolve, confirmPayment } = useEscalation(id);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    if (!audioEnabled) return;
  }, [audioEnabled]);

  const currentLevel = escalation?.current_level ?? 1;
  const commentary = useMemo(() => buildCommentaryFeed(events, escalation), [events, escalation]);
  const nextCharge = `${Math.max(1, 11 - currentLevel)} pulses`;
  const responseDetected = events.some((event) => event.type === "response_detected");
  const paymentDetected = events.some((event) => event.type === "payment_detected");

  const bottomZone = (
    <div className="grid gap-4 md:grid-cols-3">
      <RitualButton label="CONTINUE ANYWAY" subtitle="IGNORE THEIR EXCUSES" variant="arcane" onClick={() => void continueAnyway()} disabled={!escalation || escalation.status === "resolved"} />
      <RitualButton label="RESOLVE MATTER" subtitle="BEGIN DE-ESCALATION RITE" variant="stone" onClick={() => void resolve()} disabled={!escalation} />
      <RitualButton label="PAYMENT DETECTED" subtitle="CONFIRM OFFERING" variant="primary" onClick={() => void confirmPayment(escalation?.amount ?? 1, escalation?.target.name ?? "target")} disabled={!escalation} />
    </div>
  );

  return (
    <>
      {!audioEnabled && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="fortress-panel max-w-xl p-6 text-center">
            <div className="pixel-text text-[1.2rem] text-fortress-pink">ENABLE KAREN&apos;S VOICE</div>
            <p className="mt-4 font-mono text-[1.1rem] uppercase text-text">
              Permit the fortress to speak aloud during the climb.
            </p>
            <RitualButton label="UNSEAL THE VOICE GATE" subtitle="CONFIRM AUDIO" variant="primary" className="mt-6 w-full" onClick={() => setAudioEnabled(true)} />
          </div>
        </div>
      )}

      <FortressLayout
        title="LIVE ESCALATION // FORTRESS LADDER"
        subtitle="COMMAND CENTER OF MALICE"
        rightSidebar={<OpenClawCoreCard escalation={escalation} events={events} status={connected ? "AWAKE" : "LISTENING"} />}
        bottomZone={bottomZone}
        topStats={[
          { label: "TARGET", value: escalation?.target.name.toUpperCase() ?? "BINDING" },
          { label: "LEVEL", value: `${currentLevel}/10` },
          { label: "THREAT STATE", value: escalation?.status.toUpperCase() ?? "ACTIVE" },
        ]}
      >
        <div className={`grid gap-4 xl:grid-cols-[0.9fr_1.2fr_0.9fr] ${currentLevel >= 8 ? "threat-shake" : ""}`}>
          <div className="grid gap-4">
            <StonePanel title="TARGET DOSSIER" eyebrow="BOSS FIGHT HEADER">
              <div className="space-y-3 font-mono text-[1rem] uppercase">
                <div>{escalation?.grievance_detail ?? "Loading chamber..."}</div>
                <div className="flex flex-wrap gap-2">
                  <ThreatBadge label={levelTone(currentLevel)} tone={currentLevel <= 2 ? "green" : currentLevel <= 4 ? "yellow" : currentLevel <= 6 ? "orange" : currentLevel <= 8 ? "red" : currentLevel === 9 ? "purple" : "pink"} />
                  <ThreatBadge label={responseDetected ? "RESPONSE DETECTED" : "NO RESPONSE"} tone={responseDetected ? "green" : "red"} />
                  <ThreatBadge label={paymentDetected ? "PAYMENT DETECTED" : "NO PAYMENT"} tone={paymentDetected ? "green" : "orange"} />
                </div>
              </div>
            </StonePanel>
            <StonePanel title="RITUAL CHARGE METER" eyebrow="COUNTDOWN TO NEXT FLOOR">
              <div className="border-4 border-border bg-[#130f15] p-3">
                <div className="wire-run animate-wire-pulse h-6" style={{ width: `${Math.min(100, currentLevel * 10)}%` }} />
              </div>
              <div className="mt-3 pixel-text text-[0.8rem] text-fortress-pink">{nextCharge}</div>
            </StonePanel>
            <CommentaryLog lines={commentary} />
          </div>

          <EscalationTower currentLevel={currentLevel} />

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
