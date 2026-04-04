"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { RitualButton } from "@/components/RitualButton";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { channelUnlocks, personalityScripts } from "@/lib/fortress-data";
import { useCircle } from "@/hooks/useCircle";
import type { EscalationSpeed, Personality } from "@/lib/types";

const personalities: Personality[] = ["passive_aggressive", "corporate", "genuinely_concerned", "life_coach"];
const speeds: EscalationSpeed[] = ["demo", "demo_10s", "quick", "standard", "patient"];

export default function TriggerPage() {
  const router = useRouter();
  const { members, triggerEscalation } = useCircle();
  const [initiator, setInitiator] = useState("rahil");
  const [target, setTarget] = useState("");
  const [grievanceType, setGrievanceType] = useState<"financial" | "object" | "communication">("communication");
  const [grievanceDetail, setGrievanceDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [personality, setPersonality] = useState<Personality>("passive_aggressive");
  const [speed, setSpeed] = useState<EscalationSpeed>("demo");
  const [maxLevel, setMaxLevel] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [useGameMode, setUseGameMode] = useState(true);

  const preview = useMemo(() => personalityScripts[personality], [personality]);

  async function launch() {
    if (!target || !grievanceDetail) return;
    setSubmitting(true);
    try {
      const escalation = await triggerEscalation({
        initiator_id: initiator,
        target_id: target,
        grievance_type: grievanceType,
        grievance_detail: grievanceDetail,
        amount: amount ? Number(amount) : undefined,
        date_of_incident: date || undefined,
        personality,
        speed,
        max_level: maxLevel,
      });
      if (useGameMode) {
        router.push(`/escalation/${escalation.id}/game`);
      } else {
        router.push(`/escalation/${escalation.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FortressLayout
      title="MISSION ALTAR // INITIATE STRIKE"
      subtitle="COMMAND CENTER OF MALICE"
      rightSidebar={<OpenClawCoreCard status="CONSULTING" />}
      bottomZone={<RitualButton label="LAUNCH RITUAL" subtitle="UNSEAL THE CHANNEL STACK" variant="primary" className="min-h-[7rem]" disabled={submitting || !target || !grievanceDetail} onClick={launch} />}
    >
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <StonePanel title="TARGET SELECTOR" eyebrow="GRIEVANCE FORGE">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="pixel-text text-[0.6rem] text-muted">Initiator</span>
              <select className="stone-input px-3 py-3" value={initiator} onChange={(event) => setInitiator(event.target.value)}>
                <option value="rahil">Rahil</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="pixel-text text-[0.6rem] text-muted">Target</span>
              <select className="stone-input px-3 py-3" value={target} onChange={(event) => setTarget(event.target.value)}>
                <option value="">Choose victim</option>
                {members.filter((member) => member.id !== "rahil").map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="pixel-text text-[0.6rem] text-muted">Grievance Type</span>
              <select className="stone-input px-3 py-3" value={grievanceType} onChange={(event) => setGrievanceType(event.target.value as typeof grievanceType)}>
                <option value="communication">Communication</option>
                <option value="financial">Financial</option>
                <option value="object">Object</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="pixel-text text-[0.6rem] text-muted">Amount</span>
              <input className="stone-input px-3 py-3" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="199.00" />
            </label>
            <label className="grid gap-2 md:col-span-2">
              <span className="pixel-text text-[0.6rem] text-muted">Grievance Detail</span>
              <textarea className="stone-input min-h-[9rem] px-3 py-3" value={grievanceDetail} onChange={(event) => setGrievanceDetail(event.target.value)} placeholder="Describe the offense against your schedule, money, soul, or inbox." />
            </label>
            <label className="grid gap-2">
              <span className="pixel-text text-[0.6rem] text-muted">Date</span>
              <input type="date" className="stone-input px-3 py-3" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className="pixel-text text-[0.6rem] text-muted">Speed</span>
              <select className="stone-input px-3 py-3" value={speed} onChange={(event) => setSpeed(event.target.value as EscalationSpeed)}>
                {speeds.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 md:col-span-2 border-t-2 border-border pt-4 mt-2">
              <span className="pixel-text text-[0.6rem] text-muted">Max Escalation Level</span>
              <input type="range" min={1} max={10} value={maxLevel} onChange={(event) => setMaxLevel(Number(event.target.value))} />
              <div className="pixel-text text-[0.75rem] text-fortress-ember">Danger meter set to {maxLevel}</div>
            </label>

            <div className="md:col-span-2 mt-4 flex items-center gap-3 mc-container p-4 bg-[#c6c6c6] text-black">
              <input
                type="checkbox"
                id="game-mode"
                className="w-6 h-6 cursor-pointer"
                checked={useGameMode}
                onChange={e => setUseGameMode(e.target.checked)}
              />
              <label htmlFor="game-mode" className="mc-font-pixel text-[0.8rem] cursor-pointer font-bold">
                ENABLE GAME MODE VISUALIZATION
              </label>
            </div>
          </div>
        </StonePanel>

        <div className="grid gap-4">
          <StonePanel title="PERSONALITY ALTAR" eyebrow="BOSS CLASSES">
            <div className="grid gap-3 md:grid-cols-2">
              {personalities.map((option) => (
                <button
                  key={option}
                  onClick={() => setPersonality(option)}
                  className={`fortress-panel p-4 text-left ${personality === option ? "ring-4 ring-fortress-pink/40" : ""}`}
                >
                  <div className="pixel-text text-[0.8rem] text-text">{option.replaceAll("_", " ")}</div>
                  <div className="mt-2 font-mono text-[0.95rem] uppercase text-muted">
                    {option === "passive_aggressive" && "Needling elegance"}
                    {option === "corporate" && "Policy-flavored pressure"}
                    {option === "genuinely_concerned" && "Warmth with teeth"}
                    {option === "life_coach" && "Motivational menace"}
                  </div>
                </button>
              ))}
            </div>
          </StonePanel>
          <StonePanel title="KAREN PREVIEW TRANSMISSION" eyebrow="LIVE SAMPLE">
            <p className="font-mono text-[1.1rem] uppercase text-text">{preview}</p>
          </StonePanel>
          <StonePanel title="CHANNEL UNLOCKS" eyebrow="ARTIFACT STRIP">
            <div className="grid gap-2 md:grid-cols-2">
              {channelUnlocks.map((channel) => (
                <div key={channel} className="border-4 border-border bg-[#1d1820] px-3 py-3 pixel-text text-[0.62rem] text-fortress-pink">
                  {channel}
                </div>
              ))}
            </div>
          </StonePanel>
        </div>
      </div>
    </FortressLayout>
  );
}
