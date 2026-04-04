"use client";

import Link from "next/link";
import { useCircle } from "@/hooks/useCircle";
import { MemberCard } from "@/components/MemberCard";
import { getLevelColorClass } from "@/lib/constants";

export default function DashboardPage() {
  const { members, escalations, loading } = useCircle();

  const active = escalations.filter((e) => e.status === "active");
  const resolved = escalations
    .filter((e) => e.status === "resolved")
    .sort(
      (a, b) =>
        new Date(b.resolved_at ?? 0).getTime() -
        new Date(a.resolved_at ?? 0).getTime()
    )
    .slice(0, 5);

  const karenStatus =
    active.length === 0
      ? { emoji: "😴", text: "Idle — no active escalations" }
      : active.length === 1
        ? {
            emoji: "⚡",
            text: `Active — following up with ${active[0].target.name} (Level ${active[0].current_level})`,
          }
        : active.some((e) => e.current_level >= 8)
          ? { emoji: "☢️", text: `Nuclear — ${active.length} active escalations` }
          : {
              emoji: "⚡",
              text: `Active — ${active.length} escalations in progress`,
            };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 animate-pulse">
        <div className="mb-10 space-y-3">
          <div className="h-10 w-56 bg-border/30 rounded" />
          <div className="h-4 w-72 bg-border/20 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 bg-surface rounded-sm border border-border" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          THE CIRCLE
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xl">{karenStatus.emoji}</span>
          <p className="font-mono text-sm text-muted">{karenStatus.text}</p>
        </div>
      </div>

      {/* Members grid */}
      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} escalations={escalations} />
          ))}
        </div>
      </section>

      {/* Active escalations */}
      {active.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold mb-3">
            Active Escalations
          </h2>
          <div className="space-y-2">
            {active.map((esc) => (
              <Link
                key={esc.id}
                href={`/escalation/${esc.id}`}
                className="flex items-center justify-between border border-border rounded-sm bg-surface px-4 py-3 hover:bg-surface/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{esc.target.avatar_emoji}</span>
                  <div>
                    <p className="font-mono text-sm">
                      {esc.initiator.name} &rarr; {esc.target.name}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      {esc.grievance_detail}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono text-xs font-bold ${getLevelColorClass(esc.current_level)}`}
                >
                  Level {esc.current_level}/{esc.max_level}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recently resolved */}
      {resolved.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-semibold mb-3">
            Recently Resolved
          </h2>
          <div className="space-y-2">
            {resolved.map((esc) => (
              <div
                key={esc.id}
                className="flex items-center justify-between border border-border rounded-sm bg-surface/50 px-4 py-3 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{esc.target.avatar_emoji}</span>
                  <div>
                    <p className="font-mono text-sm line-through">
                      {esc.target.name} — {esc.grievance_detail}
                    </p>
                    <p className="font-mono text-xs text-muted">
                      Resolved{" "}
                      {esc.resolved_at
                        ? new Date(esc.resolved_at).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-xs text-level-green">
                  RESOLVED
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
