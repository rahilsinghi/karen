"use client";

import { useState } from "react";
import { RitualButton } from "@/components/RitualButton";

export function OnboardingFlow() {
  const [step, setStep] = useState(1);

  return (
    <div className="grid gap-4">
      <div className="fortress-panel p-4">
        <div className="pixel-text text-[0.8rem] text-text">Step {step}</div>
      </div>
      <RitualButton
        label={step >= 3 ? "SEALED" : "ADVANCE"}
        subtitle="MOVE DEEPER INTO THE FORTRESS"
        variant="primary"
        onClick={() => setStep((value) => Math.min(3, value + 1))}
      />
    </div>
  );
}
