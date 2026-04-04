"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RitualButton } from "@/components/RitualButton";
import { StonePanel } from "@/components/StonePanel";
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

function getUnlockedChannels(data: FormData): string[] {
  const channels: string[] = [];
  if (data.target_email) channels.push("email");
  if (data.target_phone) channels.push("sms");
  if (data.target_phone && data.target_whatsapp_same) channels.push("whatsapp");
  if (data.target_linkedin) channels.push("linkedin");
  if (data.target_venmo) channels.push("venmo");
  if (data.target_address) channels.push("fedex");
  return channels;
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const unlocked = getUnlockedChannels(form);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          target: {
            name: form.target_name,
            email: form.target_email,
            phone: form.target_phone,
            whatsapp: form.target_whatsapp_same ? form.target_phone : "",
            linkedin: form.target_linkedin,
            venmo: form.target_venmo,
            address: form.target_address,
          },
        }),
      });
      if (res.ok) router.push("/trigger");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      {/* Step indicators */}
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`fortress-panel p-3 text-center cursor-pointer transition-all ${
              s === step ? "border-red-500/50 bg-red-950/20" : ""
            }`}
            onClick={() => s <= step && setStep(s)}
          >
            <div className="pixel-text text-[0.6rem] text-muted">
              {s === step ? "ACTIVE" : s < step ? "SEALED" : "LOCKED"}
            </div>
            <div className="pixel-text text-[1.4rem] text-fortress-pink">{s}</div>
          </div>
        ))}
      </div>

      {/* Step 1: About You */}
      {step === 1 && (
        <StonePanel title="STEP 1 — IDENTIFY YOURSELF" eyebrow="PERSONNEL INTAKE">
          <div className="space-y-4">
            <p className="font-mono text-xs text-muted uppercase">
              Karen acts through her own accounts on your behalf. Your accounts are never accessed.
            </p>
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </StonePanel>
      )}

      {/* Step 2: Add Your First Target */}
      {step === 2 && (
        <StonePanel title="STEP 2 — NAME YOUR TARGET" eyebrow="TARGET BINDING">
          <div className="space-y-4">
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="Target Name *"
              value={form.target_name}
              onChange={(e) => set("target_name", e.target.value)}
            />
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="Target Email *"
              type="email"
              value={form.target_email}
              onChange={(e) => set("target_email", e.target.value)}
            />
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="Target Phone *"
              type="tel"
              value={form.target_phone}
              onChange={(e) => set("target_phone", e.target.value)}
            />
            <label className="flex items-center gap-2 font-mono text-xs text-muted uppercase cursor-pointer">
              <input
                type="checkbox"
                checked={form.target_whatsapp_same}
                onChange={(e) => set("target_whatsapp_same", e.target.checked)}
              />
              WhatsApp same as phone
            </label>
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="LinkedIn URL (optional)"
              value={form.target_linkedin}
              onChange={(e) => set("target_linkedin", e.target.value)}
            />
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="Venmo Handle (optional)"
              value={form.target_venmo}
              onChange={(e) => set("target_venmo", e.target.value)}
            />
            <input
              className="stone-input w-full px-3 py-3"
              placeholder="Address (optional — Karen may need this later)"
              value={form.target_address}
              onChange={(e) => set("target_address", e.target.value)}
            />

            {/* Channel unlock indicator */}
            <div className="fortress-panel p-3">
              <div className="pixel-text text-[0.6rem] text-muted mb-2">
                MORE INFO = MORE KAREN ({unlocked.length} channels unlocked)
              </div>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(CHANNEL_ICONS).map(([ch, icon]) => (
                  <span
                    key={ch}
                    className={`text-lg transition-opacity ${
                      unlocked.includes(ch) ? "opacity-100" : "opacity-20"
                    }`}
                    title={ch}
                  >
                    {icon}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </StonePanel>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <StonePanel title="STEP 3 — SEAL THE RITUAL" eyebrow="FORTRESS ACCESS">
          <div className="space-y-4">
            <div className="fortress-panel p-4">
              <div className="pixel-text text-[0.7rem] text-muted">OPERATOR</div>
              <div className="font-mono text-text uppercase">{form.name || "—"}</div>
            </div>
            <div className="fortress-panel p-4">
              <div className="pixel-text text-[0.7rem] text-muted">FIRST TARGET</div>
              <div className="font-mono text-text uppercase">{form.target_name || "—"}</div>
              <div className="font-mono text-xs text-muted mt-1">{unlocked.length} channels armed</div>
            </div>
            <p className="font-mono text-xs text-muted uppercase text-center">
              Try it with $1 from a friend you trust
            </p>
          </div>
        </StonePanel>
      )}

      {/* Navigation */}
      <div className="grid gap-4 md:grid-cols-2">
        <RitualButton
          label={step === 1 ? "LOCKED" : "PREVIOUS ALTAR"}
          subtitle="SHIFT LEFT"
          variant="stone"
          disabled={step === 1}
          onClick={() => setStep((v) => Math.max(1, v - 1))}
        />
        {step < 3 ? (
          <RitualButton
            label="NEXT ALTAR"
            subtitle="SHIFT RIGHT"
            variant="primary"
            onClick={() => setStep((v) => Math.min(3, v + 1))}
          />
        ) : (
          <RitualButton
            label={submitting ? "SEALING..." : "START A FOLLOW-UP"}
            subtitle="ENTER THE FORTRESS"
            variant="primary"
            disabled={submitting || !form.name || !form.target_name}
            onClick={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
