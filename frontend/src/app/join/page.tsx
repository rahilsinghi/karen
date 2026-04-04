"use client";

import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function JoinPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <span className="text-8xl block mb-6 animate-pulse drop-shadow-[0_0_15px_rgba(255,0,0,0.7)]">💀</span>
        <h1 className="font-display text-6xl font-bold tracking-tighter uppercase text-shadow-pixel">
          INITIATE PROTOCOL
        </h1>
        <p className="font-mono text-sm text-stone-500 mt-4 uppercase font-bold tracking-tight">
          KAREN ACTS ON YOUR BEHALF. YOUR IDENTITY REMAINS ENCRYPTED.
        </p>
      </div>

      <OnboardingFlow />
    </div>
  );
}
