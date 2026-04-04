"use client";

import { use } from "react";
import { EscalationProvider } from "@/contexts/EscalationContext";

export default function EscalationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <EscalationProvider id={id}>{children}</EscalationProvider>;
}
