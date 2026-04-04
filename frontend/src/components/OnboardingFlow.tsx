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
    "w-full bg-stone-900 border-2 border-stone-800 px-4 py-3 font-mono text-lg text-white placeholder:text-stone-600 focus:outline-none focus:border-red-600 pixel-border-stone transition-colors uppercase";

  return (
    <div className="max-w-lg mx-auto p-4">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="space-y-6 pixel-border-obsidian bg-obsidian p-8 shadow-2xl"
          >
            <div>
              <h2 className="font-display text-4xl font-bold mb-2 uppercase tracking-tighter text-shadow-pixel">
                IDENTIFY YOURSELF
              </h2>
              <p className="font-mono text-sm text-stone-500 font-bold uppercase tracking-tight">
                KAREN ACTS ON YOUR BEHALF. WE DO NOT ACCESS YOUR REAL ACCOUNTS. STAY ANONYMOUS.
              </p>
            </div>

            <div className="space-y-4">
              <input
                className={inputClass}
                placeholder="YOUR ALIAS"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="CONTACT FREQUENCY (EMAIL)"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="ENCRYPTION LINE (PHONE)"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={!form.name || !form.email || !form.phone}
              className="w-full pixel-border-stone bg-red-700 text-white font-display text-xl py-4 hover:bg-red-600 transition-all shadow-[0_6px_0_0_#900] active:translate-y-1 active:shadow-none disabled:opacity-30 disabled:cursor-not-allowed uppercase text-shadow-pixel"
            >
              INITIATE PROTOCOL &rarr;
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6 pixel-border-obsidian bg-obsidian p-8 shadow-2xl"
          >
            <div>
              <h2 className="font-display text-4xl font-bold mb-2 uppercase tracking-tighter text-shadow-pixel text-red-500">
                ACQUIRE TARGET
              </h2>
              <p className="font-mono text-sm text-stone-500 font-bold uppercase tracking-tight">
                THE MORE DATA WE HAVE, THE HARDER KAREN HITS.
              </p>
            </div>

            <div className="space-y-4">
              <input
                className={inputClass}
                placeholder="TARGET NAME *"
                value={form.target_name}
                onChange={(e) => set("target_name", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="TARGET EMAIL *"
                type="email"
                value={form.target_email}
                onChange={(e) => set("target_email", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="TARGET PHONE *"
                type="tel"
                value={form.target_phone}
                onChange={(e) => set("target_phone", e.target.value)}
              />
              <label className="flex items-center gap-3 font-mono text-xs text-stone-400 uppercase font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.target_whatsapp_same}
                  onChange={(e) => set("target_whatsapp_same", e.target.checked)}
                  className="w-5 h-5 accent-red-600"
                />
                WHATSAPP LINKED TO PHONE
              </label>
              <input
                className={inputClass}
                placeholder="LINKEDIN INTEL (OPTIONAL)"
                value={form.target_linkedin}
                onChange={(e) => set("target_linkedin", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="VENMO RANSOM ID (OPTIONAL)"
                value={form.target_venmo}
                onChange={(e) => set("target_venmo", e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="PHYSICAL LOCATION (OPTIONAL)"
                value={form.target_address}
                onChange={(e) => set("target_address", e.target.value)}
              />
            </div>

            {/* Channel unlock preview */}
            <div className="flex gap-3 flex-wrap bg-black/40 p-3 pixel-border-stone">
              <span className="font-mono text-[10px] text-stone-500 w-full mb-1 uppercase font-bold">ATTACK VECTORS UNLOCKED:</span>
              {targetChannels.map((ch) => (
                <span
                  key={ch.key}
                  className={`text-2xl transition-all duration-300 ${ch.filled ? "opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(255,0,0,0.5)]" : "opacity-10 grayscale"
                    }`}
                  title={ch.key.toUpperCase()}
                >
                  {CHANNEL_ICONS[ch.key] ?? "❓"}
                </span>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddTarget}
                disabled={
                  !form.target_name || !form.target_email || !form.target_phone
                }
                className="flex-1 pixel-border-stone bg-red-700 text-white font-display text-lg py-4 hover:bg-red-600 transition-all shadow-[0_6px_0_0_#900] active:translate-y-1 active:shadow-none disabled:opacity-30 uppercase text-shadow-pixel"
              >
                LOCK TARGET
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 pixel-border-stone bg-stone-800 text-stone-400 font-display text-lg py-4 hover:bg-stone-700 transition-all shadow-[0_6px_0_0_#000] active:translate-y-1 active:shadow-none uppercase"
              >
                SKIP
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 text-center pixel-border-obsidian bg-obsidian p-12 shadow-2xl"
          >
            <div className="relative inline-block">
              <span className="text-8xl block animate-pulse drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">💀</span>
            </div>
            <div>
              <h2 className="font-display text-5xl font-bold uppercase tracking-tighter text-shadow-pixel text-white mb-2">
                INITIATION COMPLETE
              </h2>
              <p className="font-mono text-lg text-stone-500 font-bold uppercase tracking-tight">
                WELCOME TO THE CIRCLE. KAREN IS HUNGRY.
              </p>
            </div>

            <button
              onClick={() => router.push("/trigger")}
              className="w-full pixel-border-stone bg-red-700 text-white font-display text-2xl py-6 hover:bg-red-600 transition-all shadow-[0_8px_0_0_#900] active:translate-y-1 active:shadow-none uppercase text-shadow-pixel"
            >
              UNLEASH THE FURY &rarr;
            </button>

            <p className="font-mono text-sm text-stone-600 uppercase font-bold italic">
              "WE HAVE MUCH WORK TO DO."
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
