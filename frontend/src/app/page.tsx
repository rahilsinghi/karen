"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FortressLayout } from "@/components/FortressLayout";
import { RegistryTable } from "@/components/RegistryTable";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { RitualButton } from "@/components/RitualButton";
import { StonePanel } from "@/components/StonePanel";
import { PixelStatBar } from "@/components/PixelStatBar";
import { sampleDossiers, ritualButtons } from "@/lib/fortress-data";
import { useCircle } from "@/hooks/useCircle";

export default function HomePage() {
  const router = useRouter();
  const { members, escalations, loading, triggerEscalation } = useCircle();
  const [busy, setBusy] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"standard" | "nuclear" | "manager" | null>(null);

  const liveEscalation = escalations.find((item) => item.status === "active") ?? null;

  // Drifting stat bars — nudge every 2-3s, clamped 40-99
  const [statValues, setStatValues] = useState({ fortress: 89, fear: 72, witness: 61 });

  const nudge = useCallback((current: number) => {
    const delta = Math.floor(Math.random() * 9) - 3; // -3 to +5
    return Math.max(40, Math.min(99, current + delta));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setStatValues((prev) => ({
        fortress: nudge(prev.fortress),
        fear: nudge(prev.fear),
        witness: nudge(prev.witness),
      }));
    }, 2000 + Math.random() * 1000);
    return () => clearInterval(id);
  }, [nudge]);

  const topStats = useMemo(
    () => [
      { label: "ACTIVE KAREN", value: loading ? "SYNCING" : `${escalations.filter((item) => item.status === "active").length} LIVE` },
      { label: "THREAT", value: liveEscalation ? `LEVEL ${liveEscalation.current_level}` : "EXTREME" },
      { label: "STATUS", value: liveEscalation ? liveEscalation.status.toUpperCase() : "OPTIMIZED" },
    ],
    [escalations, liveEscalation, loading]
  );

  function requestTrigger(mode: "standard" | "nuclear" | "manager") {
    setConfirmMode(mode);
  }

  async function executeTrigger() {
    if (!confirmMode) return;
    const mode = confirmMode;
    setConfirmMode(null);

    const target = members.find((member) => member.id === "rahil") ?? members[0];
    if (!target) {
      router.push("/trigger");
      return;
    }

    setBusy(true);
    try {
      const escalation = await triggerEscalation({
        target_id: target.id,
        initiator_id: "rahil",
        grievance_detail:
          mode === "nuclear"
            ? "Certified chaos packet authorized."
            : mode === "manager"
              ? "Managerial intervention demanded immediately."
              : "General grievance ritual initiated from the main hall.",
        grievance_type: mode === "nuclear" ? "financial" : "communication",
        personality: "passive_aggressive",
        speed: "demo",
        max_level: mode === "nuclear" ? 10 : mode === "manager" ? 7 : 5,
      });
      router.push(`/escalation/${escalation.id}`);
    } finally {
      setBusy(false);
    }
  }

  const bottomZone = (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
      <RitualButton
        label={ritualButtons.primary.label}
        subtitle="UNLEASH FURY"
        variant="primary"
        className="violent-unleash min-h-[13rem]"
        disabled={busy}
        onClick={() => requestTrigger("standard")}
      >
        <div className="mt-2 pixel-text text-[0.65rem] text-[#ffe1db]">
          INITIATE ESCALATION
        </div>
      </RitualButton>
      <RitualButton
        label={ritualButtons.majors[0].label}
        subtitle="TIER 5 COMPLAINT"
        variant="arcane"
        className="min-h-[8.5rem]"
        disabled={busy}
        onClick={() => requestTrigger("standard")}
      />
      <RitualButton
        label={ritualButtons.majors[1].label}
        subtitle="SEND DEMANDS"
        variant="danger"
        className="min-h-[8.5rem]"
        disabled={busy}
        onClick={() => requestTrigger("nuclear")}
      />
      <div className="xl:col-start-2 xl:col-end-4 grid gap-3 md:grid-cols-3 xl:grid-cols-3">
        {ritualButtons.minors.map((label, index) => (
          <RitualButton
            key={label}
            label={label}
            variant={index === 0 ? "stone" : index === 1 ? "stone" : index === 2 ? "stone" : index % 2 === 0 ? "arcane" : "stone"}
            className="min-h-[5rem]"
            onClick={() => router.push(index < 2 ? "/trigger" : index < 4 ? "/open-matters" : "/arsenal")}
          />
        ))}
      </div>
    </div>
  );

  return (
    <FortressLayout
      title="CURSED REGISTRY // TARGET DOSSIERS"
      subtitle="COMMAND CENTER OF MALICE"
      bottomZone={bottomZone}
      topStats={topStats}
    >
      <div className="grid h-full gap-4 xl:grid-cols-[1.42fr_0.72fr]">
        <div className="grid gap-4">
          <RegistryTable rows={sampleDossiers} />
        </div>
        <div className="grid gap-4">
          <OpenClawCoreCard escalation={liveEscalation} status={liveEscalation ? "AWAKE" : "IDLE"} />
          <StonePanel title="MALEDICTION GRID" eyebrow="ACTIVE KAREN">
            <div className="space-y-4">
              <PixelStatBar label="FORTRESS LOAD" value={statValues.fortress} color="#ff5533" />
              <PixelStatBar label="PUBLIC FEAR" value={statValues.fear} color="#ff4fd8" />
              <PixelStatBar label="WITNESS DENSITY" value={statValues.witness} color="#dbb746" />
              <div className="stone-brick-wall fortress-panel p-4">
                <div className="pixel-text text-[0.6rem] text-muted">ACTIVE MATTER</div>
                <div className="mt-2 font-mono text-[1.05rem] uppercase text-text">
                  {liveEscalation
                    ? `${liveEscalation.target.name} // ${liveEscalation.grievance_detail}`
                    : "No live target bound. Fortress awaits fresh disrespect."}
                </div>
              </div>
              <RitualButton label={ritualButtons.majors[2].label} subtitle="CALL THE WITNESS" variant="stone" onClick={() => requestTrigger("manager")} />
            </div>
          </StonePanel>
        </div>
      </div>
      {/* Confirmation Modal */}
      {confirmMode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80">
          <div className="fortress-panel stone-brick-wall p-8 max-w-md w-full mx-4 border-4 border-red-900 shadow-[0_0_40px_rgba(255,0,0,0.3)]">
            <div className="pixel-text text-[1.2rem] text-fortress-pink text-center mb-4">
              UNLEASH KAREN?
            </div>
            <div className="font-mono text-sm text-muted text-center mb-2">
              Mode: {confirmMode.toUpperCase()} // Target: RAHIL
            </div>
            <div className="font-mono text-xs text-stone-600 text-center mb-6">
              This will trigger a real escalation. Karen will send real messages.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setConfirmMode(null)}
                className="fortress-panel px-4 py-3 font-display text-sm uppercase text-stone-400 hover:text-white transition-colors text-center"
              >
                ABORT
              </button>
              <button
                onClick={executeTrigger}
                className="border-4 border-red-700 bg-red-950/60 px-4 py-3 font-display text-sm uppercase text-red-400 hover:bg-red-900/60 hover:text-white transition-colors text-center shadow-[0_0_15px_rgba(255,0,0,0.2)]"
              >
                UNLEASH
              </button>
            </div>
          </div>
        </div>
      )}
    </FortressLayout>
  );
}
