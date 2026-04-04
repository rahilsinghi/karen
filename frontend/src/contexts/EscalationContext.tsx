"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useEscalation } from "@/hooks/useEscalation";
import { useKarenAudio } from "@/hooks/useKarenAudio";
import { useBackgroundMusic } from "@/hooks/useBackgroundMusic";
import type { Escalation, KarenEvent } from "@/lib/types";

interface EscalationContextValue {
  events: KarenEvent[];
  escalation: Escalation | null;
  connected: boolean;
  loading: boolean;
  isComplete: boolean;
  continueAnyway: () => Promise<void>;
  resolve: () => Promise<void>;
  confirmPayment: (amount: number, fromName: string) => Promise<void>;
  audioEnabled: boolean;
  setAudioEnabled: (v: boolean) => void;
}

const EscalationContext = createContext<EscalationContextValue | null>(null);

export function EscalationProvider({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const escalationState = useEscalation(id);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const bgMusic = useBackgroundMusic();

  // Single audio hook — lives here, survives view switches
  useKarenAudio(escalationState.events, {
    enabled: audioEnabled,
    onPlayStart: bgMusic.duck,
    onPlayEnd: bgMusic.unduck,
  });

  // Background music lifecycle
  useEffect(() => {
    if (audioEnabled) void bgMusic.start();
    else bgMusic.stop();
  }, [audioEnabled, bgMusic.start, bgMusic.stop]);

  useEffect(() => {
    if (audioEnabled) {
      bgMusic.setLevel(escalationState.escalation?.current_level ?? 1);
    }
  }, [audioEnabled, escalationState.escalation?.current_level, bgMusic.setLevel]);

  return (
    <EscalationContext.Provider
      value={{
        ...escalationState,
        audioEnabled,
        setAudioEnabled,
      }}
    >
      {children}
    </EscalationContext.Provider>
  );
}

export function useEscalationContext() {
  const ctx = useContext(EscalationContext);
  if (!ctx)
    throw new Error(
      "useEscalationContext must be used within EscalationProvider"
    );
  return ctx;
}
