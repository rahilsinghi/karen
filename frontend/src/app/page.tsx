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

export default function HomePage() {
  const router = useRouter();
  const { members, escalations, loading, triggerEscalation } = useCircle();
  const [busy, setBusy] = useState(false);

  const liveEscalation = escalations.find((item) => item.status === "active") ?? null;

  const topStats = useMemo(
    () => [
      { label: "ACTIVE KAREN", value: loading ? "SYNCING" : `${escalations.filter((item) => item.status === "active").length} LIVE` },
      { label: "THREAT", value: liveEscalation ? `LEVEL ${liveEscalation.current_level}` : "EXTREME" },
      { label: "STATUS", value: liveEscalation ? liveEscalation.status.toUpperCase() : "OPTIMIZED" },
    ],
    [escalations, liveEscalation, loading]
  );

  async function quickTrigger(mode: "standard" | "nuclear" | "manager") {
    const target = members.find((member) => member.id !== "rahil") ?? members[0];
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
        onClick={() => quickTrigger("standard")}
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
        onClick={() => quickTrigger("standard")}
      />
      <RitualButton
        label={ritualButtons.majors[1].label}
        subtitle="SEND DEMANDS"
        variant="danger"
        className="min-h-[8.5rem]"
        disabled={busy}
        onClick={() => quickTrigger("nuclear")}
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
              <PixelStatBar label="FORTRESS LOAD" value={89} color="#ff5533" />
              <PixelStatBar label="PUBLIC FEAR" value={72} color="#ff4fd8" />
              <PixelStatBar label="WITNESS DENSITY" value={61} color="#dbb746" />
              <div className="stone-brick-wall fortress-panel p-4">
                <div className="pixel-text text-[0.6rem] text-muted">ACTIVE MATTER</div>
                <div className="mt-2 font-mono text-[1.05rem] uppercase text-text">
                  {liveEscalation
                    ? `${liveEscalation.target.name} // ${liveEscalation.grievance_detail}`
                    : "No live target bound. Fortress awaits fresh disrespect."}
                </div>
              </div>
              <RitualButton label={ritualButtons.majors[2].label} subtitle="CALL THE WITNESS" variant="stone" onClick={() => quickTrigger("manager")} />
            </div>
          </StonePanel>
        </div>
      </div>
    </FortressLayout>
  );
}
