"use client";

import type { Escalation, KarenEvent } from "@/lib/types";
import { OpenClawCoreCard } from "@/components/OpenClawCoreCard";

export function KarenBossCard({
  escalation,
  events = [],
  status,
  commentary,
}: {
  escalation?: Escalation | null;
  events?: KarenEvent[];
  status?: string;
  commentary?: string[] | string;
}) {
  const normalizedEvents = events;
  const normalizedStatus = status ?? "AWAKE";
  return <OpenClawCoreCard escalation={escalation} events={normalizedEvents} status={normalizedStatus || (Array.isArray(commentary) ? commentary[0] : commentary) || "AWAKE"} />;
}
