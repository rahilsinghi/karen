"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL, API_HEADERS } from "@/lib/constants";
import type { Escalation, KarenEvent } from "@/lib/types";

const EVENT_TYPES = [
  "escalation_started",
  "level_start",
  "level_complete",
  "level_skipped",
  "commentary",
  "response_detected",
  "payment_detected",
  "deescalation_step",
  "complete",
  "error",
  "audio",
  "research_step",
  "research_discovery",
  "fedex_rate",
  "interlude_start",
] as const;

const REFRESH_EVENTS = new Set([
  "level_complete",
  "response_detected",
  "payment_detected",
  "complete",
]);

export function useEscalation(escalationId: string | null) {
  const [events, setEvents] = useState<KarenEvent[]>([]);
  const [escalation, setEscalation] = useState<Escalation | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const sourceRef = useRef<AbortController | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeqRef = useRef(-1);
  const reconnectAttemptRef = useRef(0);
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTerminalRef = useRef(false);

  const fetchEscalation = useCallback(async () => {
    if (!escalationId) return;
    try {
      const res = await fetch(`${API_URL}/api/escalation/${escalationId}`, { headers: API_HEADERS });
      if (res.ok) {
        const data = await res.json();
        setEscalation(data);
        // Mark terminal states so we stop aggressive reconnection
        if (data.status === "resolved") {
          isTerminalRef.current = true;
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [escalationId]);

  // Reset state when escalation ID changes
  useEffect(() => {
    setEvents([]);
    setEscalation(null);
    setConnected(false);
    setLoading(true);
    lastSeqRef.current = -1;
    reconnectAttemptRef.current = 0;
    isTerminalRef.current = false;
  }, [escalationId]);

  useEffect(() => {
    if (!escalationId) return;
    queueMicrotask(() => {
      void fetchEscalation();
    });

    function connect() {
      // Use fetch-based SSE instead of EventSource so we can send
      // the ngrok-skip-browser-warning header (EventSource can't send headers)
      const lastSeq = lastSeqRef.current;
      const params = new URLSearchParams();
      if (lastSeq >= 0) params.set("last_seq", String(lastSeq));
      const url = `${API_URL}/api/escalation/${escalationId}/stream?${params}`;

      const abortController = new AbortController();
      sourceRef.current = abortController;

      fetch(url, {
        headers: { ...API_HEADERS, Accept: "text/event-stream" },
        signal: abortController.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) throw new Error("SSE connect failed");

          setConnected(true);
          if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
          stableTimerRef.current = setTimeout(() => {
            reconnectAttemptRef.current = 0;
          }, 5000);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            let eventType = "";
            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ") && eventType) {
                try {
                  const data = JSON.parse(line.slice(6));
                  const seq = typeof data.seq === "number" ? data.seq : -1;
                  if (seq >= 0 && seq <= lastSeqRef.current) { eventType = ""; continue; }
                  if (seq >= 0) lastSeqRef.current = seq;
                  setEvents((prev) => [...prev, data as KarenEvent]);
                  if (REFRESH_EVENTS.has(eventType)) fetchEscalation();
                } catch {
                  // ignore parse errors
                }
                eventType = "";
              } else if (line === "") {
                eventType = "";
              }
            }
          }

          // Stream ended cleanly — reconnect
          throw new Error("stream ended");
        })
        .catch((err) => {
          if (abortController.signal.aborted) return;
          setConnected(false);
          if (stableTimerRef.current) {
            clearTimeout(stableTimerRef.current);
            stableTimerRef.current = null;
          }
          // Don't aggressively reconnect for completed escalations
          if (isTerminalRef.current) return;
          const attempt = reconnectAttemptRef.current;
          reconnectAttemptRef.current = attempt + 1;
          const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
          reconnectTimer.current = setTimeout(() => {
            connect();
          }, delay);
        });
    }

    connect();

    return () => {
      sourceRef.current?.abort();
      sourceRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
      setConnected(false);
    };
  }, [escalationId, fetchEscalation]);

  const continueAnyway = useCallback(async () => {
    if (!escalationId) return;
    await fetch(`${API_URL}/api/escalation/${escalationId}/continue`, {
      method: "POST",
      headers: API_HEADERS,
    });
    fetchEscalation();
  }, [escalationId, fetchEscalation]);

  const resolve = useCallback(async () => {
    if (!escalationId) return;
    await fetch(`${API_URL}/api/escalation/${escalationId}/resolve`, {
      method: "POST",
      headers: API_HEADERS,
    });
    fetchEscalation();
  }, [escalationId, fetchEscalation]);

  const confirmPayment = useCallback(
    async (amount: number, fromName: string) => {
      if (!escalationId) return;
      await fetch(`${API_URL}/api/payment-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...API_HEADERS },
        body: JSON.stringify({
          escalation_id: escalationId,
          amount,
          from_name: fromName,
        }),
      });
      fetchEscalation();
    },
    [escalationId, fetchEscalation]
  );

  const isComplete = escalation?.status === "resolved" || events.some(e => e.type === "complete");

  return { events, escalation, connected, loading, isComplete, continueAnyway, resolve, confirmPayment };
}
