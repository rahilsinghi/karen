"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FortressLayout } from "@/components/FortressLayout";
import { RegistryTable } from "@/components/RegistryTable";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { RitualButton } from "@/components/RitualButton";
import { StonePanel } from "@/components/StonePanel";
import { PixelStatBar } from "@/components/PixelStatBar";
import { sampleDossiers, ritualButtons } from "@/lib/fortress-data";
import { useCircle } from "@/hooks/useCircle";
import { TransmissionFeed } from "@/components/TransmissionFeed";
import { useEscalation } from "@/hooks/useEscalation";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const router = useRouter();
  const { members, escalations, loading, triggerEscalation } = useCircle();
  const [busy, setBusy] = useState(false);
  const [confirmMode, setConfirmMode] = useState<"standard" | "nuclear" | "manager" | null>(null);

  const liveEscalationData = escalations.find((item) => item.status === "active") ?? null;
  const { events: liveEvents } = useEscalation(liveEscalationData?.id ?? null);
  const liveEscalation = liveEscalationData;

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
            ? "Certified chaos packet authorized. No survivors."
            : mode === "manager"
              ? "Managerial intervention demanded immediately. Escalate to the top."
              : "General grievance ritual initiated from the main hall. Prepare for impact.",
        grievance_type: mode === "nuclear" ? "financial" : "communication",
        personality: "passive_aggressive",
        speed: "demo",
        max_level: mode === "nuclear" ? 10 : mode === "manager" ? 7 : 5,
      });
      router.push(`/escalation/${escalation.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to release Karen.");
    } finally {
      setBusy(false);
    }
  }

  const sideButtons = (
    <div className="flex flex-col gap-4 h-full">
      <RitualButton
        label={ritualButtons.primary.label}
        subtitle="UNLEASH FURY"
        variant="primary"
        className="violent-unleash min-h-[12rem]"
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
        className="min-h-[8rem]"
        disabled={busy}
        onClick={() => requestTrigger("standard")}
      />
      <RitualButton
        label={ritualButtons.majors[1].label}
        subtitle="SEND DEMANDS"
        variant="danger"
        className="min-h-[8rem]"
        disabled={busy}
        onClick={() => requestTrigger("nuclear")}
      />

      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <TransmissionFeed escalation={liveEscalation} events={liveEvents} />
      </div>

      <div className="mt-auto p-4 border-4 border-border bg-[#1a101a] text-center opacity-50">
        <div className="pixel-text text-[0.5rem] mb-1">STRIKE_COORDINATES</div>
        <div className="pixel-text text-[0.7rem] text-fortress-pink uppercase">LOC_PRIMARY_FORTRESS</div>
      </div>
    </div>
  );

  const bottomZone = ritualButtons.minors.length > 0 ? (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5 w-full">
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
  ) : null;

  return (
    <FortressLayout
      title="CURSED REGISTRY // TARGET DOSSIERS"
      subtitle="COMMAND CENTER OF MALICE"
      bottomZone={bottomZone}
      rightSidebar={sideButtons}
      topStats={topStats}
    >
      <div className="grid h-full gap-4 xl:grid-cols-[1fr_320px] flex-1">
        <div className="flex flex-col gap-4 min-h-0 h-full">
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="flex-1 min-h-0">
              {loading ? (
                <div className="fortress-panel flex items-center justify-center h-[30rem] bg-[#16141a]">
                  <div className="pixel-text text-text animate-pulse">SYNCHRONIZING WITH THE ABYSS...</div>
                </div>
              ) : (
                <div className="h-full overflow-y-auto custom-scrollbar">
                  <RegistryTable rows={sampleDossiers} />
                </div>
              )}
            </div>

            <StonePanel title="MALEDICTION GRID" eyebrow="ACTIVE KAREN" className="shrink-0">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
                <div className="space-y-4">
                  <PixelStatBar label="FORTRESS LOAD" value={89} color="#ff5533" />
                  <PixelStatBar label="PUBLIC FEAR" value={72} color="#ff4fd8" />
                </div>
                <div className="space-y-4">
                  <PixelStatBar label="WITNESS DENSITY" value={61} color="#dbb746" />
                  <RitualButton label={ritualButtons.majors[2].label} subtitle="CALL THE WITNESS" variant="stone" className="h-24 py-4" onClick={() => requestTrigger("manager")} />
                </div>
                <div className="md:col-span-2 stone-brick-wall fortress-panel p-4 h-full">
                  <div className="pixel-text text-[0.6rem] text-muted uppercase">ACTIVE MATTER RESPONSE UNIT</div>
                  <div className="mt-3 font-mono text-[1.05rem] uppercase text-text leading-tight">
                    {liveEscalation
                      ? `${liveEscalation.target.name} // ${liveEscalation.grievance_detail}`
                      : "No live target bound. Fortress awaits fresh disrespect from the surface world."}
                  </div>
                </div>
              </div>
            </StonePanel>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
          <OpenClawCoreCard escalation={liveEscalation} status={liveEscalation ? "AWAKE" : "IDLE"} />
        </div>
      </div>
      {/* Confirmation Modal */}
      {confirmMode && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl px-4 flex flex-col items-center justify-center min-h-screen">
            <div className="relative w-full">
              {/* Abort Cross */}
              <button
                onClick={() => setConfirmMode(null)}
                className="absolute -top-6 -left-6 z-[210] flex h-14 w-14 items-center justify-center rounded-full bg-red-950 border-4 border-red-600 text-white hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                aria-label="Abort"
              >
                <span className="pixel-text text-3xl mt-1">✕</span>
              </button>

              <motion.button
                initial={{ x: 0, y: 0 }}
                animate={{
                  x: [-6, 8, -8, 6, -4, 4, -2],
                  y: [2, -3, 3, -2, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.1,
                  ease: "linear"
                }}
                onClick={executeTrigger}
                className="group relative w-full border-[12px] border-red-600 bg-red-950/80 py-12 overflow-hidden shadow-[0_0_120px_rgba(255,0,0,0.6)] active:scale-95"
              >
                <span className="block font-display text-5xl md:text-7xl leading-none text-white tracking-widest translate-y-1">
                  UNLEASH
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </FortressLayout>
  );
}
