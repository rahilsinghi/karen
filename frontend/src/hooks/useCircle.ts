"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/constants";
import type { ChannelStatus, Escalation, Member, TriggerRequest } from "@/lib/types";

export function useCircle() {
  const [members, setMembers] = useState<Member[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/members`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchEscalations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/escalations`);
      if (res.ok) setEscalations(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchChannels = useCallback(
    async (memberId: string): Promise<ChannelStatus[]> => {
      try {
        const res = await fetch(`${API_URL}/api/members/${memberId}/channels`);
        if (res.ok) return res.json();
      } catch {
        // silent
      }
      return [];
    },
    []
  );

  const triggerEscalation = useCallback(async (request: Partial<TriggerRequest>) => {
    const res = await fetch(`${API_URL}/api/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to trigger escalation");
    }
    const data = await res.json();
    fetchEscalations();
    return data as Escalation;
  }, [fetchEscalations]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMembers();
    void fetchEscalations();

    // Poll escalations every 3 seconds
    const interval = setInterval(fetchEscalations, 3000);
    return () => clearInterval(interval);
  }, [fetchMembers, fetchEscalations]);

  const loading = members.length === 0 && escalations.length === 0;

  return { members, escalations, loading, fetchChannels, triggerEscalation, createEscalation: triggerEscalation, refetch: fetchMembers };
}
