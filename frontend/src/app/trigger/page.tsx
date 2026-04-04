"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, LEVEL_LABELS, PERSONALITY_LABELS, SPEED_LABELS, getLevelColorClass } from "@/lib/constants";
import type { Escalation, Member, Personality } from "@/lib/types";

const PERSONALITY_PREVIEWS: Record<Personality, (target: string, initiator: string) => string> = {
  passive_aggressive: (target, initiator) =>
    `HI ${target.toUpperCase()}! \u{1F642} JUST WANTED TO CIRCLE BACK ON THAT DINNER. I'M SURE IT SIMPLY SLIPPED YOUR MIND. THESE THINGS HAPPEN! ${initiator.toUpperCase()} MENTIONED IT, AND I THOUGHT I'D REACH OUT. NO PRESSURE AT ALL. \u{1F642}`,
  corporate: (target, _initiator) =>
    `DEAR ${target.toUpperCase()}, PER OUR RECORDS, AN OUTSTANDING BALANCE OF $23 REMAINS UNRESOLVED. PLEASE ADVISE ON EXPECTED RESOLUTION TIMELINE. THIS MATTER HAS BEEN FLAGED FOR ESCALATION.`,
  genuinely_concerned: (target, initiator) =>
    `HEY ${target.toUpperCase()}, I HOPE YOU'RE DOING WELL! I'M REACHING OUT BECAUSE ${initiator.toUpperCase()} MENTIONED THE DINNER, AND I JUST WANT TO MAKE SURE EVERYTHING'S OKAY BETWEEN YOU TWO. $23 ISN'T WORTH THE FRICTION.`,
  life_coach: (target, _initiator) =>
    `${target.toUpperCase()}, I'M REACHING OUT ABOUT AN UNRESOLVED DEBT. UNADDRESSED OBLIGATIONS CREATE ENERGETIC BLOCKS. THIS IS AN OPPORTUNITY FOR ACCOUNTABILITY.`,
};

function PersonalityPreview({
  personality,
  initiator,
  target,
}: {
  personality: Personality;
  initiator: Member | undefined;
  target: Member | undefined;
}) {
  const targetFirst = target?.name.split(" ")[0] ?? "TARGET";
  const initiatorFirst = initiator?.name.split(" ")[0] ?? "INITIATOR";
  const message = useMemo(
    () => PERSONALITY_PREVIEWS[personality](targetFirst, initiatorFirst),
    [personality, targetFirst, initiatorFirst],
  );

  return (
    <div className="pixel-border-stone bg-stone-900/50 p-6 shadow-inner">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl animate-pulse">📡</span>
        <span className="font-display text-sm text-red-500 uppercase font-bold tracking-widest text-shadow-pixel">
          INTEL PREVIEW — {PERSONALITY_LABELS[personality].toUpperCase()}
        </span>
      </div>
      <p className="font-mono text-sm text-stone-300 font-bold uppercase leading-relaxed tracking-tight">{message}</p>
      <p className="font-mono text-[10px] text-stone-600 mt-4 font-bold uppercase italic">
        KAREN GENERATES UNIQUE MALICE FOR EVERY STRIKE.
      </p>
    </div>
  );
}

function TriggerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<Member[]>([]);

  const [initiatorId, setInitiatorId] = useState("");
  const [targetId, setTargetId] = useState(searchParams.get("target") ?? "");
  const [grievanceType, setGrievanceType] = useState("financial");
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [personality, setPersonality] = useState("passive_aggressive");
  const [speed, setSpeed] = useState("demo");
  const [maxLevel, setMaxLevel] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/members`)
      .then((r) => r.json())
      .then((d) => {
        setMembers(d.members);
        if (!initiatorId && d.members.length > 0) {
          setInitiatorId(d.members[0].id);
        }
      })
      .catch(() => { });
  }, [initiatorId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiator_id: initiatorId,
          target_id: targetId,
          grievance_type: grievanceType,
          grievance_detail: detail,
          amount: amount ? parseFloat(amount) : undefined,
          personality,
          speed,
          max_level: maxLevel,
        }),
      });
      if (res.ok) {
        const esc: Escalation = await res.json();
        router.push(`/escalation/${esc.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    "w-full bg-stone-900 pixel-border-stone px-4 py-3 font-mono text-sm text-stone-200 focus:outline-none focus:bg-stone-800 transition-colors appearance-none font-bold uppercase";
  const inputClass =
    "w-full bg-stone-900 pixel-border-stone px-4 py-3 font-mono text-sm text-stone-200 placeholder:text-stone-700 focus:outline-none focus:bg-stone-800 transition-colors font-bold uppercase";

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display text-5xl font-bold mb-2 uppercase tracking-tighter text-shadow-pixel">INITIATE STRIKE</h1>
      <p className="font-mono text-xs text-stone-500 font-bold uppercase mb-10 tracking-tight">
        CHOOSE YOUR TARGET. CHOOSE YOUR GRIEVANCE. UNLEASH THE ENTITY.
      </p>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Initiator */}
          <div>
            <label className="block font-mono text-xs text-stone-600 font-bold uppercase mb-2">
              INITIATOR (YOU)
            </label>
            <select
              className={selectClass}
              value={initiatorId}
              onChange={(e) => setInitiatorId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.avatar_emoji} {m.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Target */}
          <div>
            <label className="block font-mono text-xs text-stone-600 font-bold uppercase mb-2">
              PRIMARY TARGET
            </label>
            <select
              className={selectClass}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
            >
              <option value="">SELECT TARGET...</option>
              {members
                .filter((m) => m.id !== initiatorId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.avatar_emoji} {m.name.toUpperCase()}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Grievance type */}
        <div>
          <label className="block font-mono text-xs text-stone-600 font-bold uppercase mb-2">
            STRIKE CATEGORY
          </label>
          <div className="grid grid-cols-3 gap-3">
            {["financial", "object", "communication"].map((type) => (
              <button
                key={type}
                onClick={() => setGrievanceType(type)}
                className={`pixel-border-stone px-3 py-3 font-mono text-xs font-bold uppercase transition-colors ${grievanceType === type
                  ? "bg-red-900 border-red-600 text-white shadow-[inset_0_0_10px_rgba(255,0,0,0.5)]"
                  : "bg-stone-900 text-stone-500 hover:text-stone-300"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Detail + amount */}
        <div className="space-y-4">
          <label className="block font-mono text-xs text-stone-600 font-bold uppercase mb-2">
            GRIEVANCE PARAMETERS
          </label>
          <input
            className={inputClass}
            placeholder="WHAT HAPPENED? (E.G., $23 DINNER — FEB 8)"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
          {grievanceType === "financial" && (
            <input
              className={inputClass}
              placeholder="AMOUNT ($)"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}
        </div>

        {/* Personality */}
        <div>
          <label className="block font-mono text-xs text-stone-600 font-bold uppercase mb-2">
            ATTACK SUBROUTINE
          </label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PERSONALITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPersonality(key)}
                className={`pixel-border-stone px-4 py-3 font-mono text-xs font-bold uppercase transition-all ${personality === key
                  ? "bg-red-900 border-red-600 text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                  : "bg-stone-900 text-stone-500 hover:text-stone-300"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Personality preview */}
        <PersonalityPreview
          personality={personality as Personality}
          initiator={members.find((m) => m.id === initiatorId)}
          target={members.find((m) => m.id === targetId)}
        />

        {/* Speed */}
        <div>
          <label className="block font-mono text-xs text-stone-600 font-bold uppercase mb-2">
            ESCALATION VELOCITY
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(SPEED_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSpeed(key)}
                className={`pixel-border-stone px-2 py-3 font-mono text-[10px] font-bold uppercase transition-colors ${speed === key
                  ? "bg-red-900 border-red-600 text-white"
                  : "bg-stone-900 text-stone-500 hover:text-stone-300"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Max level */}
        <div className="pixel-border-stone bg-stone-900/30 p-6">
          <label className="block font-mono text-xs text-stone-600 font-bold uppercase mb-4">
            TERMINAL ESCALATION CAPACITY: <span className="text-red-500 text-lg ml-2">{maxLevel}</span>
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={maxLevel}
            onChange={(e) => setMaxLevel(parseInt(e.target.value))}
            className="w-full accent-red-600 mb-4"
          />
          <div className="flex justify-between font-mono text-[10px] text-stone-700 font-bold mb-4">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={i < maxLevel ? "text-red-500" : ""}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <p className="font-mono text-[10px] text-stone-500 font-bold uppercase text-center border-t border-stone-800 pt-4">
            FINAL ATTACK VECTOR: <span className="text-stone-300">{LEVEL_LABELS[maxLevel].toUpperCase()}</span>
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!initiatorId || !targetId || !detail || submitting}
          className="w-full h-20 pixel-border-red bg-red-700 text-white font-display font-bold text-3xl shadow-[0_0_30px_rgba(255,0,0,0.4)] hover:bg-red-600 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] active:translate-y-1 transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed group"
        >
          {submitting ? (
            <span className="animate-pulse">ENGAGING...</span>
          ) : (
            <span className="flex items-center justify-center gap-4">
              RELEASE THE KAREN <span className="text-4xl group-hover:rotate-12 transition-transform">💀</span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function TriggerPage() {
  return (
    <Suspense>
      <TriggerPageInner />
    </Suspense>
  );
}
