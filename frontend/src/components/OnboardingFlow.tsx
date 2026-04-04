"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL, CHANNEL_ICONS } from "@/lib/constants";

interface FormData {
  name: string;
  email: string;
  phone: string;
  target_name: string;
  target_email: string;
  target_phone: string;
  target_whatsapp_same: boolean;
  target_linkedin: string;
  target_venmo: string;
  target_address: string;
}

const INITIAL: FormData = {
  name: "",
  email: "",
  phone: "",
  target_name: "",
  target_email: "",
  target_phone: "",
  target_whatsapp_same: true,
  target_linkedin: "",
  target_venmo: "",
  target_address: "",
};

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [memberId, setMemberId] = useState<string | null>(null);
  const router = useRouter();

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const targetChannels = [
    { key: "email", filled: !!form.target_email },
    { key: "sms", filled: !!form.target_phone },
    { key: "whatsapp", filled: form.target_whatsapp_same ? !!form.target_phone : false },
    { key: "linkedin", filled: !!form.target_linkedin },
    { key: "discord", filled: true },
    { key: "github", filled: true },
    { key: "fedex", filled: !!form.target_address },
  ];

  const handleJoin = async () => {
    const res = await fetch(`${API_URL}/api/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        contacts: { email: form.email, phone: form.phone },
      }),
    });
    if (res.ok) {
      const member = await res.json();
      setMemberId(member.id);
      setStep(1);
    }
  };

  const handleAddTarget = async () => {
    await fetch(`${API_URL}/api/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.target_name,
        contacts: {
          email: form.target_email,
          phone: form.target_phone,
          whatsapp: form.target_whatsapp_same ? form.target_phone : "FILL_BEFORE_DEMO",
          linkedin: form.target_linkedin || "FILL_BEFORE_DEMO",
          venmo: form.target_venmo || "FILL_BEFORE_DEMO",
          address: form.target_address || "FILL_BEFORE_DEMO",
        },
      }),
    });
    setStep(2);
  };

  const inputClass =
    "w-full bg-bg border border-border rounded-sm px-3 py-2 font-mono text-sm text-text placeholder:text-muted/50 focus:outline-none focus:border-karen";

  return (
    <div className="max-w-lg mx-auto">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div>
              <h2 className="font-display text-2xl font-bold mb-1">
                About You
              </h2>
              <p className="font-mono text-xs text-muted">
                Karen acts through her own accounts on your behalf. Your
                accounts are never accessed.
              </p>
            </div>

            <input
              className={inputClass}
              placeholder="Full name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />

            <button
              onClick={handleJoin}
              disabled={!form.name || !form.email || !form.phone}
              className="w-full border border-karen text-karen font-mono text-sm py-2.5 hover:bg-karen/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Join The Circle &rarr;
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
          >
            <div>
              <h2 className="font-display text-2xl font-bold mb-1">
                Add Your First Target
              </h2>
              <p className="font-mono text-xs text-muted">
                More info = more Karen.
              </p>
            </div>

            <input
              className={inputClass}
              placeholder="Their name *"
              value={form.target_name}
              onChange={(e) => set("target_name", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Their email *"
              type="email"
              value={form.target_email}
              onChange={(e) => set("target_email", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Their phone *"
              type="tel"
              value={form.target_phone}
              onChange={(e) => set("target_phone", e.target.value)}
            />
            <label className="flex items-center gap-2 font-mono text-xs text-muted">
              <input
                type="checkbox"
                checked={form.target_whatsapp_same}
                onChange={(e) => set("target_whatsapp_same", e.target.checked)}
                className="accent-karen"
              />
              WhatsApp is the same number
            </label>
            <input
              className={inputClass}
              placeholder="LinkedIn URL (optional)"
              value={form.target_linkedin}
              onChange={(e) => set("target_linkedin", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Venmo handle (optional)"
              value={form.target_venmo}
              onChange={(e) => set("target_venmo", e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Address (optional — Karen may need this later)"
              value={form.target_address}
              onChange={(e) => set("target_address", e.target.value)}
            />

            {/* Channel unlock preview */}
            <div className="flex gap-2 flex-wrap">
              {targetChannels.map((ch) => (
                <span
                  key={ch.key}
                  className={`text-sm transition-opacity duration-300 ${
                    ch.filled ? "opacity-100" : "opacity-20"
                  }`}
                >
                  {CHANNEL_ICONS[ch.key] ?? "?"}
                </span>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddTarget}
                disabled={
                  !form.target_name || !form.target_email || !form.target_phone
                }
                className="flex-1 border border-karen text-karen font-mono text-sm py-2.5 hover:bg-karen/10 transition-colors disabled:opacity-30"
              >
                Add to Circle
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-border text-muted font-mono text-sm py-2.5 hover:bg-surface transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 text-center"
          >
            <span className="text-6xl block">🦞</span>
            <h2 className="font-display text-3xl font-bold">
              You&apos;re In
            </h2>
            <p className="font-mono text-sm text-muted">
              Welcome to The Circle. Karen is ready when you are.
            </p>

            <button
              onClick={() => router.push("/trigger")}
              className="border border-karen text-karen font-mono text-sm px-6 py-2.5 hover:bg-karen/10 transition-colors"
            >
              Start a follow-up &rarr;
            </button>

            <p className="font-mono text-xs text-muted">
              Try it with $1 from a friend you trust
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
