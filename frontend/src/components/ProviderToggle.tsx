"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL, API_HEADERS } from "@/lib/constants";

type Provider = "anthropic" | "local";

export function ProviderToggle() {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [hasActive, setHasActive] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/config`, { headers: API_HEADERS })
      .then((r) => r.json())
      .then((d) => {
        setProvider(d.ai_provider);
        setHasActive(d.has_active);
      })
      .catch(() => {});
  }, []);

  const toggle = useCallback(async () => {
    if (hasActive || switching) return;
    const next: Provider = provider === "anthropic" ? "local" : "anthropic";
    setSwitching(true);
    try {
      const res = await fetch(`${API_URL}/api/config/provider`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...API_HEADERS },
        body: JSON.stringify({ provider: next }),
      });
      const data = await res.json();
      if (data.ai_provider) setProvider(data.ai_provider);
    } finally {
      setSwitching(false);
    }
  }, [provider, hasActive, switching]);

  const isCloud = provider === "anthropic";
  const disabled = hasActive || switching;

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={
        hasActive
          ? "Cannot switch during active escalation"
          : `Switch to ${isCloud ? "Local (Ollama)" : "Cloud (Anthropic)"}`
      }
      className={`
        flex items-center gap-3 px-3 py-1.5 border-2 font-mono text-[0.6rem] uppercase tracking-widest
        transition-all duration-200 select-none
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:brightness-125 active:scale-95"}
        border-stone-700 bg-stone-900/80
      `}
    >
      <span className={`transition-colors ${isCloud ? "text-indigo-400" : "text-stone-600"}`}>☁️ CLOUD</span>
      {/* Toggle track */}
      <div className="relative w-8 h-4 bg-stone-800 border border-stone-600 rounded-full">
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-200 ${
            isCloud
              ? "left-0.5 bg-indigo-400 shadow-[0_0_6px_rgba(129,140,248,0.6)]"
              : "left-[calc(100%-14px)] bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
          }`}
        />
      </div>
      <span className={`transition-colors ${!isCloud ? "text-emerald-400" : "text-stone-600"}`}>🖥️ LOCAL</span>
    </button>
  );
}
