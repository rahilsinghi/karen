"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/constants";
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
  const sourceRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSeqRef = useRef(-1);
  const reconnectAttemptRef = useRef(0);
  const stableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEscalation = useCallback(async () => {
    if (!escalationId) return;
    try {
      const res = await fetch(`${API_URL}/api/escalation/${escalationId}`);
      if (res.ok) setEscalation(await res.json());
    } catch {
      // silent
    }
  }, [escalationId]);

  useEffect(() => {
    if (!escalationId) return;
    queueMicrotask(() => {
      void fetchEscalation();
    });

    function connect() {
      // Pass last_seq so server only replays events we haven't seen
      const lastSeq = lastSeqRef.current;
      const url =
        lastSeq >= 0
          ? `${API_URL}/api/escalation/${escalationId}/stream?last_seq=${lastSeq}`
          : `${API_URL}/api/escalation/${escalationId}/stream`;

      const source = new EventSource(url);
      sourceRef.current = source;

      source.onopen = () => {
        setConnected(true);
        // Only reset backoff after connection is stable for 5s
        if (stableTimerRef.current) clearTimeout(stableTimerRef.current);
        stableTimerRef.current = setTimeout(() => {
          reconnectAttemptRef.current = 0;
        }, 5000);
      };

      source.onerror = () => {
        setConnected(false);
        source.close();
        if (stableTimerRef.current) {
          clearTimeout(stableTimerRef.current);
          stableTimerRef.current = null;
        }
        const attempt = reconnectAttemptRef.current;
        reconnectAttemptRef.current = attempt + 1;
        // Exponential backoff: 2s, 4s, 8s, 16s, cap at 30s
        const delay = Math.min(2000 * Math.pow(2, attempt), 30000);
        reconnectTimer.current = setTimeout(() => {
          connect();
        }, delay);
      };

      for (const type of EVENT_TYPES) {
        source.addEventListener(type, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            const seq = typeof data.seq === "number" ? data.seq : -1;
            // Deduplicate: skip events already processed
            if (seq >= 0 && seq <= lastSeqRef.current) return;
            if (seq >= 0) lastSeqRef.current = seq;
            setEvents((prev) => [...prev, data as KarenEvent]);
            if (REFRESH_EVENTS.has(type)) fetchEscalation();
          } catch {
            // ignore
          }
        });
      }
    }

    connect();

    return () => {
      sourceRef.current?.close();
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
    });
    fetchEscalation();
  }, [escalationId, fetchEscalation]);

  const resolve = useCallback(async () => {
    if (!escalationId) return;
    await fetch(`${API_URL}/api/escalation/${escalationId}/resolve`, {
      method: "POST",
    });
    fetchEscalation();
  }, [escalationId, fetchEscalation]);

  const confirmPayment = useCallback(
    async (amount: number, fromName: string) => {
      if (!escalationId) return;
      await fetch(`${API_URL}/api/payment-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return { events, escalation, connected, continueAnyway, resolve, confirmPayment };
}
