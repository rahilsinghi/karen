"use client";
import { motion } from "framer-motion";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FortressLayout } from "@/components/FortressLayout";
import { OnboardingFlow } from "@/components/OnboardingFlow";

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="fortress-bg min-h-screen flex items-center justify-center pixel-text text-text">LOADING RITUAL...</div>}>
      <FortressLayout
        title="JOIN THE FORTRESS // THREE-STEP INTAKE"
        subtitle="COMMAND CENTER OF MALICE"
      >
        <div className="mx-auto w-full max-w-5xl">
          <OnboardingFlow />
        </div>
      </FortressLayout>
    </Suspense>
  );
}
