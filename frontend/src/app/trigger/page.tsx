"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { RitualButton } from "@/components/RitualButton";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";
import { channelUnlocks, personalityScripts } from "@/lib/fortress-data";
import { useCircle } from "@/hooks/useCircle";
import { motion } from "framer-motion";
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
  const [venmoHandle, setVenmoHandle] = useState("");
  const [itemName, setItemName] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [platform, setPlatform] = useState("discord");
  const [daysSinceLastResponse, setDaysSinceLastResponse] = useState("");
  const [date, setDate] = useState("");
  const [personality, setPersonality] = useState<Personality>("passive_aggressive");
  const [speed, setSpeed] = useState<EscalationSpeed>("demo");
  const [maxLevel, setMaxLevel] = useState(6);
  const [submitting, setSubmitting] = useState(false);
  const [useGameMode, setUseGameMode] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (members.length > 0 && !members.some((m) => m.id === initiator)) {
      setInitiator(members[0].id);
    }
  }, [members, initiator]);

  const preview = useMemo(() => personalityScripts[personality], [personality]);

  const fillDemo = () => {
    const targetMember = members.find(m => m.id !== initiator);
    setTarget(targetMember?.id || "");
    setGrievanceType("communication");
    setGrievanceDetail("Ghosted the last 3 ritual invites and didn't even react with a lobster emoji.");
    setPlatform("discord");
    setDaysSinceLastResponse("7");
    setPersonality("passive_aggressive");
  };

  async function launch() {
    if (!target || !grievanceDetail) return;

    if (!showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }

    setSubmitting(true);
    try {
      let detail = grievanceDetail;
      if (grievanceType === "financial" && venmoHandle) {
        detail += ` (Venmo: ${venmoHandle})`;
      } else if (grievanceType === "object") {
        const parts: string[] = [];
        if (itemName) parts.push(`Item: ${itemName}`);
        if (estimatedValue) parts.push(`Est. value: $${estimatedValue}`);
        if (parts.length > 0) detail += ` (${parts.join(", ")})`;
      } else if (grievanceType === "communication") {
        const parts: string[] = [];
        if (platform) parts.push(`Platform: ${platform}`);
        if (daysSinceLastResponse) parts.push(`${daysSinceLastResponse} days without response`);
        if (parts.length > 0) detail += ` (${parts.join(", ")})`;
      }

      const escalation = await triggerEscalation({
        initiator_id: initiator,
        target_id: target,
        grievance_type: grievanceType,
        grievance_detail: detail,
        amount: grievanceType === "financial" && amount ? Number(amount) : undefined,
        venmo_handle: grievanceType === "financial" && venmoHandle ? venmoHandle : undefined,
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
      setShowConfirmModal(false);
    }
  }

  return (
    <FortressLayout
      title="MISSION ALTAR // INITIATE STRIKE"
      subtitle="COMMAND CENTER OF MALICE"
      rightSidebar={<OpenClawCoreCard status="CONSULTING" />}
      bottomZone={<RitualButton label="UNLEASH KAREN 🦞" subtitle="THE LOBSTER AWAKENS" variant="primary" className="min-h-[7rem]" disabled={submitting || !target || !grievanceDetail} onClick={launch} />}
    >
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-md">
          {/* Background Dungeons */}
          <div className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" style={{ backgroundImage: 'url("/dungeon_bg.png")' }} />

          {/* Darkness Vignette */}
          <div className="absolute inset-0 z-10 bg-radial-gradient(circle, transparent 20%, black 85%) pointer-events-none" />

          <div className="relative w-full max-w-xl px-4 flex flex-col items-center justify-center z-20">
            <div className="mc-container relative w-full p-10 text-center bg-[#c6c6c6] shadow-[0_0_100px_rgba(239,68,68,0.3)]">
              {/* Abort Cross */}
              <button
                onClick={() => setShowConfirmModal(false)}
                className="absolute top-4 right-4 z-[210] flex h-10 w-10 items-center justify-center rounded-full bg-red-950 border-4 border-red-600 text-white hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(255,0,0,0.2)]"
                aria-label="Abort"
              >
                <span className="pixel-text text-xl mt-1">✕</span>
              </button>

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
              <h1 className="mc-font-pixel text-3xl mb-8 text-black tracking-tight">UNSEAL THE SONIC ARCHIVE</h1>

              <motion.button
                initial={{ x: 0, y: 0 }}
                animate={{
                  x: [-4, 4, -3, 3, -2, 2, 0],
                  y: [1.5, -1.5, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.2,
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
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end p-2">
        <button
          onClick={fillDemo}
          className="mc-button px-6 h-10 text-[0.6rem] bg-indigo-900 border-indigo-500 hover:bg-indigo-800"
        >
          ⚡ QUICK FILL FOR TEST
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <StonePanel title="TARGET SELECTOR" eyebrow="GRIEVANCE FORGE">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="pixel-text text-[0.6rem] text-muted">Initiator</span>
              <select className="stone-input px-3 py-3" value={initiator} onChange={(event) => setInitiator(event.target.value)}>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.avatar_emoji} {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="pixel-text text-[0.6rem] text-muted">Target</span>
              <select className="stone-input px-3 py-3" value={target} onChange={(event) => setTarget(event.target.value)}>
                <option value="">Choose victim</option>
                {members.filter((member) => member.id !== initiator).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.avatar_emoji} {member.name}
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
            {grievanceType === "financial" && (
              <>
                <label className="grid gap-2">
                  <span className="pixel-text text-[0.6rem] text-muted">Amount ($)</span>
                  <input className="stone-input px-3 py-3" type="number" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="23.00" />
                </label>
                <label className="grid gap-2">
                  <span className="pixel-text text-[0.6rem] text-muted">Venmo Handle</span>
                  <input className="stone-input px-3 py-3" value={venmoHandle} onChange={(event) => setVenmoHandle(event.target.value)} placeholder="@RahilSinghi" />
                </label>
              </>
            )}
            {grievanceType === "object" && (
              <>
                <label className="grid gap-2">
                  <span className="pixel-text text-[0.6rem] text-muted">Item Name</span>
                  <input className="stone-input px-3 py-3" value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="AirPods Pro" />
                </label>
                <label className="grid gap-2">
                  <span className="pixel-text text-[0.6rem] text-muted">Estimated Value ($)</span>
                  <input className="stone-input px-3 py-3" type="number" step="0.01" value={estimatedValue} onChange={(event) => setEstimatedValue(event.target.value)} placeholder="249.00" />
                </label>
              </>
            )}
            {grievanceType === "communication" && (
              <>
                <label className="grid gap-2">
                  <span className="pixel-text text-[0.6rem] text-muted">Where Were You Ghosted?</span>
                  <select className="stone-input px-3 py-3" value={platform} onChange={(event) => setPlatform(event.target.value)}>
                    <option value="discord">Discord</option>
                    <option value="imessage">iMessage</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="grid gap-2">
                  <span className="pixel-text text-[0.6rem] text-muted">Days Since Last Response</span>
                  <input className="stone-input px-3 py-3" type="number" min="0" value={daysSinceLastResponse} onChange={(event) => setDaysSinceLastResponse(event.target.value)} placeholder="14" />
                </label>
              </>
            )}
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
              {personalities.map((option) => {
                const selected = personality === option;
                return (
                  <button
                    key={option}
                    onClick={() => setPersonality(option)}
                    className={`p-4 text-left cursor-pointer transition-all duration-150 border-4 ${selected
                      ? "border-fortress-pink bg-fortress-pink/10 shadow-[0_0_20px_rgba(236,72,153,0.25)] scale-[1.02]"
                      : "border-border bg-surface hover:border-fortress-pink/30 hover:bg-fortress-pink/5"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${selected ? "opacity-100" : "opacity-30"}`}>
                        {option === "passive_aggressive" ? "🙂" : option === "corporate" ? "📋" : option === "genuinely_concerned" ? "💕" : "🧘"}
                      </span>
                      <div className={`pixel-text text-[0.8rem] ${selected ? "text-fortress-pink" : "text-text"}`}>
                        {option.replaceAll("_", " ")}
                      </div>
                    </div>
                    <div className="mt-2 font-mono text-[0.85rem] uppercase text-muted">
                      {option === "passive_aggressive" && "Needling elegance"}
                      {option === "corporate" && "Policy-flavored pressure"}
                      {option === "genuinely_concerned" && "Warmth with teeth"}
                      {option === "life_coach" && "Motivational menace"}
                    </div>
                    {selected && (
                      <div className="mt-2 pixel-text text-[0.5rem] text-fortress-pink uppercase">● SELECTED</div>
                    )}
                  </button>
                );
              })}
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
