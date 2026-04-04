"use client";

import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function JoinPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <span className="text-5xl block mb-4">🦞</span>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Join The Circle
        </h1>
        <p className="font-mono text-xs text-muted mt-2">
          Karen acts through her own accounts. Your accounts are never accessed.
        </p>
      </div>

      <OnboardingFlow />
    </div>
  );
}
