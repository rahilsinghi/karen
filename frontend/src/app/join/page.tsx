"use client";

import { FortressLayout } from "@/components/FortressLayout";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function JoinPage() {
  return (
    <FortressLayout
      title="JOIN THE FORTRESS // THREE-STEP INTAKE"
      subtitle="COMMAND CENTER OF MALICE"
    >
      <div className="mx-auto w-full max-w-5xl">
        <OnboardingFlow />
      </div>
    </FortressLayout>
  );
}
