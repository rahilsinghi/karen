"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEscalation } from "@/hooks/useEscalation";
import { useCircle } from "@/hooks/useCircle";
import { EscalationTimeline } from "@/components/EscalationTimeline";
import { KarenSidebar } from "@/components/KarenSidebar";
import { DeescalationSequence } from "@/components/DeescalationSequence";
import {
  PERSONALITY_LABELS,
  getLevelColorClass,
  getLevelColor,
} from "@/lib/constants";
import { useKarenAudio } from "@/hooks/useKarenAudio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";

// ---------------------------------------------------------------------------
// Countdown timer between levels
// ---------------------------------------------------------------------------

const SPEED_SECONDS: Record<string, number> = {
  demo: 5,
  demo_10s: 10,
  quick: 600,
  standard: 3600,
  patient: 86400,
};

function CountdownTimer({
  seconds,
  active,
  levelColor,
}: {
  seconds: number;
  active: boolean;
  levelColor: string;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!active) return;
    startRef.current = Date.now();
    setRemaining(seconds);

    let raf: number;
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const left = Math.max(0, seconds - elapsed);
      setRemaining(left);
      if (left > 0) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, seconds]);

  if (!active) return null;

  const progress = 1 - remaining / seconds;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2.5"
    >
      <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-border"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="none"
          stroke={levelColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeOffset}
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <span className="font-mono text-xs text-muted whitespace-nowrap">
        Next level in {Math.ceil(remaining)}s...
      </span>
    </motion.div>
  );
}

export default function EscalationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { events, escalation, connected, continueAnyway, resolve, confirmPayment } =
    useEscalation(id);
  const { members } = useCircle();
  const [paymentPending, setPaymentPending] = useState(false);

  // --- Audio ---
  const [audioEnabled, setAudioEnabled] = useState(false);
  const music = useBackgroundMusic();

  useKarenAudio(audioEnabled ? events : [], {
    onPlayStart: music.duck,
    onPlayEnd: music.unduck,
  });

  // Track event count to detect new arrivals
  const prevEventCountRef = useRef(0);
  const musicStartedRef = useRef(false);

  // --- Audio: start music when enabled + escalation active, update level ---
  useEffect(() => {
    if (!audioEnabled) return;

    // Start music immediately if escalation exists and isn't complete
    if (!musicStartedRef.current && escalation && escalation.status !== "resolved") {
      music.start();
      musicStartedRef.current = true;
      // Set level to current if we're joining mid-escalation
      if (escalation.current_level > 0) {
        music.setLevel(escalation.current_level);
      }
    }

    const prevCount = prevEventCountRef.current;
    if (events.length <= prevCount) return;

    const newEvents = events.slice(prevCount);
    prevEventCountRef.current = events.length;

    for (const event of newEvents) {
      if (event.type === "level_start") {
        music.setLevel(event.level);
      } else if (event.type === "complete") {
        music.stop();
        musicStartedRef.current = false;
      }
    }
  }, [events, audioEnabled, escalation, music]);

  // --- Countdown timer state ---
  const countdownActive = useMemo(() => {
    if (events.length === 0) return false;
    const last = events[events.length - 1];
    // Show countdown after a level completes while escalation is still going
    return last.type === "level_complete";
  }, [events]);

  const countdownLevel = useMemo(() => {
    // Find the most recent level_complete to determine the "next" level color
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.type === "level_complete") return e.level + 1;
    }
    return 1;
  }, [events]);

  const isResponseDetected = events.some(
    (e) => e.type === "response_detected"
  );
  const isPaymentDetected = events.some(
    (e) => e.type === "payment_detected"
  );
  const isComplete = events.some((e) => e.type === "complete");
  const hasDeescalation = events.some(
    (e) => e.type === "deescalation_step"
  );

  const nextTarget = useMemo(() => {
    if (!escalation || members.length === 0) return "";
    const exclude = new Set([escalation.initiator.id, escalation.target.id]);
    const candidate = members.find((m) => !exclude.has(m.id));
    return candidate?.name ?? "";
  }, [escalation, members]);

  if (!escalation) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col animate-pulse">
        {/* Header skeleton */}
        <div className="border-b border-border px-6 py-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 bg-border/30 rounded-full" />
            <div className="h-4 w-4 bg-border/20 rounded" />
            <div className="h-7 w-7 bg-border/30 rounded-full" />
            <div className="h-5 w-56 bg-border/30 rounded ml-2" />
          </div>
          <div className="h-3 w-72 bg-border/20 rounded" />
        </div>
        {/* Two-column skeleton */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-surface rounded-sm border border-border" />
            ))}
          </div>
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-surface p-4 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className="h-8 w-8 bg-border/30 rounded-full shrink-0" />
                <div className="h-12 flex-1 bg-border/20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const elapsed = Math.round(
    (Date.now() - new Date(escalation.started_at).getTime()) / 60000
  );

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Audio autoplay gate */}
      <AnimatePresence>
        {!audioEnabled && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm flex items-center justify-center"
          >
            <button
              onClick={() => setAudioEnabled(true)}
              className="border border-karen text-karen font-mono text-sm px-6 py-3 hover:bg-karen/10 transition-colors"
            >
              Enable Karen&apos;s Voice 🔊
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{escalation.initiator.avatar_emoji}</span>
              <span className="font-mono text-sm text-muted">&rarr;</span>
              <span className="text-lg">{escalation.target.avatar_emoji}</span>
              <h1 className="font-display text-lg font-bold ml-2">
                {escalation.initiator.name} &rarr; {escalation.target.name}
              </h1>
            </div>
            <p className="font-mono text-xs text-muted mt-1">
              {escalation.grievance_detail} ·{" "}
              {PERSONALITY_LABELS[escalation.personality]} ·{" "}
              <span className={getLevelColorClass(escalation.current_level)}>
                Level {escalation.current_level}/{escalation.max_level}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs text-muted">
            <span>Messages: {escalation.messages_sent}</span>
            <span>Channels: {escalation.channels_used.length}</span>
            <span>{elapsed}m elapsed</span>
            <AnimatePresence>
              {countdownActive &&
                escalation.status === "active" &&
                !isComplete && (
                  <CountdownTimer
                    key={`countdown-${countdownLevel}`}
                    seconds={SPEED_SECONDS[escalation.speed] ?? 5}
                    active={countdownActive}
                    levelColor={getLevelColor(
                      Math.min(countdownLevel, escalation.max_level)
                    )}
                  />
                )}
            </AnimatePresence>
            {escalation.status === "active" && !isPaymentDetected && (
              <button
                disabled={paymentPending}
                onClick={async () => {
                  setPaymentPending(true);
                  await confirmPayment(
                    escalation.amount ?? 0,
                    escalation.target.name
                  );
                }}
                className="bg-[#008CFF] hover:bg-[#0074d4] disabled:opacity-50 text-white font-mono text-xs font-bold px-3 py-1.5 transition-colors"
              >
                {paymentPending ? "Confirming..." : "Payment Received"}
              </button>
            )}
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-level-green" : "bg-level-red"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Response/Payment banner */}
      {isResponseDetected && !isComplete && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          className="border-b border-level-green/30 bg-level-green/5 px-6 py-3 flex items-center justify-between"
        >
          <p className="font-mono text-sm text-level-green">
            💬 Response detected from {escalation.target.name}. Karen is
            standing by.
          </p>
          <div className="flex gap-2">
            <button
              onClick={resolve}
              className="border border-level-green text-level-green font-mono text-xs px-3 py-1 hover:bg-level-green/10"
            >
              De-escalate now
            </button>
            <button
              onClick={continueAnyway}
              className="border border-level-red text-level-red font-mono text-xs px-3 py-1 hover:bg-level-red/10"
            >
              Continue anyway
            </button>
          </div>
        </motion.div>
      )}

      {isPaymentDetected && !isComplete && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "auto" }}
          className="border-b border-karen/30 bg-karen/5 px-6 py-3 flex items-center justify-between"
        >
          <p className="font-mono text-sm text-karen">
            💰 Payment detected. Karen is waiting for your command.
          </p>
          <button
            onClick={resolve}
            className="border border-karen text-karen font-mono text-xs px-3 py-1 hover:bg-karen/10"
          >
            Initiate De-escalation
          </button>
        </motion.div>
      )}

      {/* Two-column layout — stacks on mobile */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <EscalationTimeline events={events} speed={escalation.speed} />
          {hasDeescalation && (
            <div className="mt-4">
              <DeescalationSequence events={events} />
            </div>
          )}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 border border-karen/30 bg-karen/5 rounded-sm p-6 text-center"
            >
              <p className="font-mono text-sm text-karen">
                All resolved. Relationships restored. Is there anyone else
                you&apos;d like me to follow up with? 🙂
              </p>
              <input
                className="mt-4 w-64 bg-bg border border-border rounded-sm px-3 py-2 font-mono text-sm text-text text-center placeholder:text-muted/50 focus:outline-none focus:border-karen"
                placeholder="Next target..."
                defaultValue={nextTarget}
                autoFocus
              />
            </motion.div>
          )}

          {!isComplete && escalation.status === "active" && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={resolve}
                className="border border-level-red/50 text-level-red font-mono text-xs px-4 py-2 hover:bg-level-red/10 transition-colors"
              >
                Initiate De-escalation
              </button>
            </div>
          )}
        </div>

        {/* Right: Karen sidebar */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-surface shrink-0">
          <KarenSidebar events={events} />
        </div>
      </div>
    </div>
  );
}
