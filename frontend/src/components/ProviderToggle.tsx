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
        flex items-center gap-2 px-4 py-2 border-2 font-mono text-xs uppercase tracking-widest
        transition-all duration-200 select-none
        ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:brightness-125 active:scale-95"}
        ${isCloud
          ? "bg-indigo-950/60 border-indigo-500/50 text-indigo-300"
          : "bg-emerald-950/60 border-emerald-500/50 text-emerald-300"
        }
      `}
    >
      <span className="text-base">{isCloud ? "☁️" : "🖥️"}</span>
      <span>{switching ? "..." : isCloud ? "CLOUD" : "LOCAL"}</span>
    </button>
  );
}
