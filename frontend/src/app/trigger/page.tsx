"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { RitualButton } from "@/components/RitualButton";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { channelUnlocks, personalityScripts } from "@/lib/fortress-data";
import { useCircle } from "@/hooks/useCircle";
import type { EscalationSpeed, Personality } from "@/lib/types";

const personalities: Personality[] = ["passive_aggressive", "corporate", "genuinely_concerned", "life_coach"];
const speeds: EscalationSpeed[] = ["demo", "demo_10s", "quick", "standard", "patient"];

function TriggerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [showError, setShowError] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fillDemo = () => {
    if (members.length > 0) {
      const other = members.find(m => m.id !== "rahil");
      if (other) setTarget(other.id);
    }
    setGrievanceDetail("They stole my favorite stapler and refused to acknowledge the theft in the group chat. This is a violation of the sacred office code and must be rectified immediately by the OpenClaw Fortress.");
    setShowError(false);
  };

  // Deep linking logic
  useEffect(() => {
    const targetName = searchParams.get("target");
    if (targetName && members.length > 0) {
      const found = members.find(m => m.name.toLowerCase() === targetName.toLowerCase() || m.id === targetName);
      if (found) setTarget(found.id);
    }
  }, [searchParams, members]);

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
        router.push(`/escalation/${escalation.id}/game?resonance=true`);
      } else {
        router.push(`/escalation/${escalation.id}`);
      }
    } finally {
      setSubmitting(false);
      setShowConfirmModal(false);
    }
  }

  return (
    <FortressLayout
      title="MISSION ALTAR // INITIATE STRIKE"
      subtitle="COMMAND CENTER OF MALICE"
      rightSidebar={<OpenClawCoreCard status="CONSULTING" />}
      bottomZone={
        <div className="flex flex-col gap-2 w-full">
          <RitualButton
            label="RELEASE KAREN"
            subtitle="INITIATE FULL ESCALATION STRIKE"
            variant="primary"
            className="min-h-[7rem] w-full"
            disabled={submitting || !target || !grievanceDetail}
            onClick={() => setShowConfirmModal(true)}
          />
          {(!target || !grievanceDetail) && (
            <div className="text-center py-2 bg-red-950/40 border-2 border-red-900 animate-pulse">
              <span className="pixel-text text-[0.65rem] text-red-400 uppercase tracking-widest font-bold">
                ⚠ Mission Blocked: {!target ? "No Target Selected" : "Grievance Detail Missing"}
              </span>
            </div>
          )}
        </div>
      }
    >
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-md">
          {/* Background Dungeons */}
          <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: 'url("/dungeon_bg.png")' }} />

          {/* Darkness Vignette */}
          <div className="absolute inset-0 z-10 bg-radial-gradient(circle, transparent 20%, black 85%) pointer-events-none" />

          <div className="relative w-full max-w-xl px-4 flex flex-col items-center justify-center relative z-20">
            {/* Abort Cross */}
            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute -top-10 -right-6 z-[210] flex h-14 w-14 items-center justify-center rounded-full bg-red-950 border-4 border-red-600 text-white hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(255,0,0,0.4)]"
              aria-label="Abort"
            >
              <span className="pixel-text text-3xl mt-1">✕</span>
            </button>

            <div className="mc-container w-full p-10 text-center bg-[#c6c6c6] shadow-[0_0_100px_rgba(239,68,68,0.3)]">
              <div className="mb-8 flex justify-center">
                <motion.div
                  animate={{
                    filter: ["drop-shadow(0 0 5px #ef4444)", "drop-shadow(0 0 20px #ef4444)", "drop-shadow(0 0 5px #ef4444)"]
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="text-6xl"
                >
                  🦀
                </motion.div>
              </div>
              <h1 className="mc-font-pixel text-3xl mb-4 text-black tracking-tight">UNSEAL THE SONIC ARCHIVE</h1>
              <p className="mc-font-game text-lg mb-10 text-[#3f3f3f] leading-relaxed uppercase">
                THE KAREN ENTITY COMMUNICATES THROUGH VIBRATIONS.
                FAILING TO ENABLE RESONANCE WILL RESULT IN AN INCOMPLETE RITUAL.
              </p>

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
                onClick={launch}
                className="group relative w-full border-[12px] border-red-600 bg-red-950/90 py-10 overflow-hidden shadow-[0_0_120px_rgba(255,0,0,0.6)] active:scale-95"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 to-transparent" />
                <span className="block font-display text-4xl md:text-5xl leading-none text-white tracking-widest translate-y-1 relative z-10">
                  UNLEASH
                </span>
                <div className="mt-2 mc-font-pixel text-[0.65rem] text-red-200 relative z-10">ESTABLISH RESONANCE</div>
              </motion.button>

              <div className="mt-8 mc-font-pixel text-[0.6rem] text-stone-500 uppercase">
                Requires Audio Output Device // Unseal at your own risk
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="grid gap-6 p-2">
        <div className="flex justify-end">
          <button
            onClick={fillDemo}
            className="mc-button px-6 h-10 text-[0.6rem] bg-indigo-900 border-indigo-500 hover:bg-indigo-800"
          >
            ⚡ QUICK FILL FOR TEST
          </button>
        </div>
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

export default function TriggerPage() {
  return (
    <Suspense fallback={<div className="pixel-text text-text p-20 animate-pulse">ESTABLISHING MISSION CHANNEL...</div>}>
      <TriggerPageInner />
    </Suspense>
  );
}
