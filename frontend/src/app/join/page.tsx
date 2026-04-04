"use client";

import { useState } from "react";
import { FortressLayout } from "@/components/FortressLayout";
import { StonePanel } from "@/components/StonePanel";
import { RitualButton } from "@/components/RitualButton";
import { channelUnlocks } from "@/lib/fortress-data";

export default function JoinPage() {
  const [step, setStep] = useState(1);

  return (
    <FortressLayout
      title="JOIN THE FORTRESS // THREE-STEP INTAKE"
      subtitle="COMMAND CENTER OF MALICE"
    >
      <div className="mx-auto grid w-full max-w-5xl gap-4">
        <StonePanel title={`STEP ${step} ALTAR`} eyebrow="PERSONNEL INTAKE">
          {step === 1 && <div className="font-mono text-[1.1rem] uppercase text-text">Name the operator and bind the grievance appetite.</div>}
          {step === 2 && <div className="font-mono text-[1.1rem] uppercase text-text">Reveal channels, context, and who deserves to be impossible to ignore.</div>}
          {step === 3 && <div className="font-mono text-[1.1rem] uppercase text-text">Seal the ritual. More info equals more Karen.</div>}
        </StonePanel>

        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <StonePanel key={item} title={`ALTAR ${item}`} eyebrow={item === step ? "ACTIVE" : "STANDBY"}>
              <div className="pixel-text text-[1.4rem] text-fortress-pink">{item}</div>
            </StonePanel>
          ))}
        </div>

        <StonePanel title="CHANNEL UNLOCK ANIMATION" eyebrow="MORE INFO = MORE KAREN">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {channelUnlocks.slice(0, step * 3).map((channel) => (
              <div key={channel} className="fortress-panel p-3 pixel-text text-[0.65rem] text-text">
                {channel}
              </div>
            ))}
          </div>
        </StonePanel>

        <div className="grid gap-4 md:grid-cols-2">
          <RitualButton label={step === 1 ? "BACKLOCKED" : "PREVIOUS ALTAR"} subtitle="SHIFT LEFT" variant="stone" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} />
          <RitualButton label={step === 3 ? "FORTRESS ACCESS GRANTED" : "NEXT ALTAR"} subtitle="SHIFT RIGHT" variant="primary" onClick={() => setStep((value) => Math.min(3, value + 1))} />
        </div>
      </div>
    </FortressLayout>
  );
}
