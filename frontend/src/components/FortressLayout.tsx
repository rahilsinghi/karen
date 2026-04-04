"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { fortressNav } from "@/lib/fortress-data";
import { CorruptionDrip } from "@/components/CorruptionDrip";
import { RuneDivider } from "@/components/RuneDivider";
import { TorchDecoration } from "@/components/TorchDecoration";

type FortressLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle: string;
  rightSidebar?: ReactNode;
  bottomZone?: ReactNode;
  topStats?: { label: string; value: string }[];
};

export function FortressLayout({
  children,
  title,
  subtitle,
  rightSidebar,
  bottomZone,
  topStats = [
    { label: "ACTIVE KAREN", value: "TRUE" },
    { label: "THREAT", value: "EXTREME" },
    { label: "STATUS", value: "OPTIMIZED" },
  ],
}: FortressLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="fortress-bg min-h-screen px-4 py-4 md:px-6">
      <div className="fortress-panel stone-brick-wall-dark relative mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[1540px] flex-col overflow-hidden bg-transparent">
        <CorruptionDrip />

        <div className="wire-run animate-wire-pulse absolute left-[22%] right-[16%] top-[7.5rem] z-0 hidden h-2 md:block" />
        <div className="wire-run animate-wire-pulse absolute bottom-[12.5rem] left-[24%] right-[6%] z-0 hidden h-2 xl:block" />
        <div className="wire-node absolute left-[20%] top-[7.15rem] hidden md:block" />
        <div className="wire-node absolute right-[14%] top-[7.15rem] hidden md:block" />

        <header className="relative z-10 flex flex-col gap-4 border-b-4 border-border bg-[#19161d]/92 px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-end gap-4">
            <Link href="/" className="block">
              <div className="pixel-text type-glow text-[2.3rem] leading-none text-fortress-ember sm:text-[3.4rem]">
                KAREN
              </div>
            </Link>
            <div className="pb-1 font-mono text-[1.05rem] uppercase tracking-[0.18em] text-[#e7946b]">
              {subtitle}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {topStats.map((stat) => (
              <div
                key={stat.label}
                className="min-w-[10rem] border-4 border-border bg-[#321416] px-4 py-2 shadow-[inset_3px_3px_0_rgba(255,255,255,0.08),inset_-3px_-3px_0_rgba(0,0,0,0.36)]"
              >
                <div className="pixel-text text-[0.55rem] text-muted">{stat.label}</div>
                <div className="pixel-text text-[1rem] text-text">{stat.value}</div>
              </div>
            ))}
          </div>
        </header>

        <div className="relative z-10 grid flex-1 gap-5 px-4 py-5 xl:grid-cols-[180px_minmax(0,1fr)_320px]">
          <aside className="flex flex-col gap-4">
            <div className="p-1">
              <div className="pixel-text text-[0.6rem] text-muted">COMMAND CENTER OF MALICE</div>
              <RuneDivider />
              <nav className="mt-4 flex flex-col gap-3">
                {fortressNav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ x: 3 }}
                        whileTap={{ y: 4 }}
                        className={`stone-brick-wall relative flex items-center gap-3 border-4 border-border px-3 py-3 ${
                          active
                            ? "shadow-[inset_3px_3px_0_rgba(255,255,255,0.12),inset_-3px_-3px_0_rgba(0,0,0,0.42),0_0_18px_rgba(255,79,216,0.22)]"
                            : "shadow-[inset_3px_3px_0_rgba(255,255,255,0.08),inset_-3px_-3px_0_rgba(0,0,0,0.38)]"
                        }`}
                      >
                        <span className="pixel-text text-[0.9rem] text-fortress-pink">{item.icon}</span>
                        <span className="pixel-text text-[0.74rem] leading-tight text-text">{item.label}</span>
                      </motion.div>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-1 items-end justify-between px-2">
              <TorchDecoration />
              <TorchDecoration />
            </div>
          </aside>

          <section className="flex min-h-0 flex-col gap-4">
            <div className="fortress-panel px-4 py-3">
              <div className="pixel-text text-[1rem] text-text">{title}</div>
            </div>
            <div className="min-h-0 flex-1">{children}</div>
            {bottomZone}
          </section>

          <aside className="min-h-[18rem]">
            {rightSidebar ?? <div className="fortress-panel h-full p-4" />}
          </aside>
        </div>
      </div>
    </div>
  );
}
