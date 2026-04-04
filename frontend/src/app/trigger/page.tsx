"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL, LEVEL_LABELS, PERSONALITY_LABELS, SPEED_LABELS, getLevelColorClass } from "@/lib/constants";
import type { Escalation, Member, Personality } from "@/lib/types";

const PERSONALITY_PREVIEWS: Record<Personality, (target: string, initiator: string) => string> = {
  passive_aggressive: (target, initiator) =>
    `Hi ${target}! \u{1F642} Just wanted to circle back on that dinner from February. I'm sure it simply slipped your mind. These things happen! ${initiator} mentioned it, and I thought I'd reach out. No pressure at all. \u{1F642}`,
  corporate: (target, _initiator) =>
    `Dear ${target}, Per our records, an outstanding balance of $23 remains unresolved from the February 8th engagement. Please advise on expected resolution timeline. This matter has been flagged for follow-up.`,
  genuinely_concerned: (target, initiator) =>
    `Hey ${target}, I hope you're doing well! I'm reaching out because ${initiator} mentioned the dinner from February, and I just want to make sure everything's okay between you two. $23 isn't worth any awkwardness.`,
  life_coach: (target, _initiator) =>
    `${target}, I'm reaching out about an unresolved matter from February 8th. Unaddressed financial obligations create energetic blocks in our relationships. This is an opportunity for growth and accountability.`,
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
  const targetFirst = target?.name.split(" ")[0] ?? "Target";
  const initiatorFirst = initiator?.name.split(" ")[0] ?? "Initiator";
  const message = useMemo(
    () => PERSONALITY_PREVIEWS[personality](targetFirst, initiatorFirst),
    [personality, targetFirst, initiatorFirst],
  );

  return (
    <div className="border-l-2 border-karen bg-surface rounded-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{"\u{1F99E}"}</span>
        <span className="font-mono text-[10px] text-karen uppercase tracking-wider">
          Level 1 Preview — {PERSONALITY_LABELS[personality]}
        </span>
      </div>
      <p className="font-mono text-xs text-text/80 leading-relaxed">{message}</p>
      <p className="font-mono text-[10px] text-muted mt-3 italic">
        This is a sample. Karen generates unique messages each time.
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
      .catch(() => {});
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
    "w-full bg-bg border border-border rounded-sm px-3 py-2 font-mono text-sm text-text focus:outline-none focus:border-karen appearance-none";
  const inputClass =
    "w-full bg-bg border border-border rounded-sm px-3 py-2 font-mono text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-karen";

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl font-bold mb-1">New Escalation</h1>
      <p className="font-mono text-xs text-muted mb-8">
        Choose your target. Choose your grievance. Unleash Karen.
      </p>

      <div className="space-y-5">
        {/* Initiator */}
        <div>
          <label className="block font-mono text-xs text-muted mb-1">
            Who&apos;s following up
          </label>
          <select
            className={selectClass}
            value={initiatorId}
            onChange={(e) => setInitiatorId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar_emoji} {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Target */}
        <div>
          <label className="block font-mono text-xs text-muted mb-1">
            Who are they following up with
          </label>
          <select
            className={selectClass}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">Select target...</option>
            {members
              .filter((m) => m.id !== initiatorId)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.avatar_emoji} {m.name}
                </option>
              ))}
          </select>
        </div>

        {/* Grievance type */}
        <div>
          <label className="block font-mono text-xs text-muted mb-1">
            Grievance type
          </label>
          <select
            className={selectClass}
            value={grievanceType}
            onChange={(e) => setGrievanceType(e.target.value)}
          >
            <option value="financial">Financial</option>
            <option value="object">Object</option>
            <option value="communication">Communication</option>
          </select>
        </div>

        {/* Detail + amount */}
        <input
          className={inputClass}
          placeholder="What happened? (e.g., $23 dinner — February 8, 2026)"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
        />
        {grievanceType === "financial" && (
          <input
            className={inputClass}
            placeholder="Amount ($)"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        )}

        {/* Personality */}
        <div>
          <label className="block font-mono text-xs text-muted mb-1">
            Karen&apos;s personality
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PERSONALITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPersonality(key)}
                className={`border rounded-sm px-3 py-2 font-mono text-xs transition-colors ${
                  personality === key
                    ? "border-karen text-karen bg-karen/10"
                    : "border-border text-muted hover:border-muted"
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
          <label className="block font-mono text-xs text-muted mb-1">
            Escalation speed
          </label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(SPEED_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSpeed(key)}
                className={`border rounded-sm px-2 py-2 font-mono text-[10px] transition-colors ${
                  speed === key
                    ? "border-karen text-karen bg-karen/10"
                    : "border-border text-muted hover:border-muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Max level */}
        <div>
          <label className="block font-mono text-xs text-muted mb-1">
            Max escalation level: {maxLevel}
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={maxLevel}
            onChange={(e) => setMaxLevel(parseInt(e.target.value))}
            className="w-full accent-karen"
          />
          <div className="flex justify-between font-mono text-[10px] text-muted mt-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className={i < maxLevel ? getLevelColorClass(i + 1) : ""}
              >
                {i + 1}
              </span>
            ))}
          </div>
          <p className="font-mono text-[10px] text-muted mt-1">
            Channels at max: {LEVEL_LABELS[maxLevel]}
          </p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!initiatorId || !targetId || !detail || submitting}
          className="w-full border-2 border-karen text-karen font-display font-bold text-lg py-3 hover:bg-karen/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting ? "Unleashing..." : "Unleash Karen 🦞"}
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
