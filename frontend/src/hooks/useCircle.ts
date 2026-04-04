"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/constants";
import type { ChannelStatus, Escalation, Member } from "@/lib/types";

export function useCircle() {
  const [members, setMembers] = useState<Member[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    Promise.all([fetchMembers(), fetchEscalations()]).finally(() =>
      setLoading(false)
    );

    // Poll escalations every 3 seconds
    const interval = setInterval(fetchEscalations, 3000);
    return () => clearInterval(interval);
  }, [fetchMembers, fetchEscalations]);

  return { members, escalations, loading, fetchChannels, refetch: fetchMembers };
}
