"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL, API_HEADERS } from "@/lib/constants";
import type { ChannelStatus, Escalation, Member, TriggerRequest } from "@/lib/types";

export function useCircle() {
  const [members, setMembers] = useState<Member[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/members`, { headers: API_HEADERS });
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
      const res = await fetch(`${API_URL}/api/escalations`, { headers: API_HEADERS });
      if (res.ok) setEscalations(await res.json());
    } catch {
      // silent
    }
  }, []);

  const fetchChannels = useCallback(
    async (memberId: string): Promise<ChannelStatus[]> => {
      try {
        const res = await fetch(`${API_URL}/api/members/${memberId}/channels`, { headers: API_HEADERS });
        if (res.ok) return res.json();
      } catch {
        // silent
      }
      return [];
    },
    []
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchMembers(), fetchEscalations()]);
    setLoading(false);
  }, [fetchMembers, fetchEscalations]);

  const triggerEscalation = useCallback(async (request: Partial<TriggerRequest>) => {
    const res = await fetch(`${API_URL}/api/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...API_HEADERS },
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
    void fetchAll();

    // Poll escalations every 3 seconds
    const interval = setInterval(fetchEscalations, 3000);
    return () => clearInterval(interval);
  }, [fetchAll, fetchEscalations]);

  return { members, escalations, loading, triggerEscalation, createEscalation: triggerEscalation, refetch: fetchAll };
}
