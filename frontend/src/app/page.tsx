"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCircle } from "@/hooks/useCircle";
import { ProviderToggle } from "@/components/ProviderToggle";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardPage() {
  const { members, escalations, loading } = useCircle();
  const [activeTab, setActiveTab] = useState("targets");

  // Filter members who are being targeted
  const targetedMembers = useMemo(() => {
    return members.map((m) => {
      const activeEsc = escalations.find(
        (e) => e.target.id === m.id && e.status === "active"
      );
      return {
        ...m,
        status: activeEsc ? "ESCALATING" : "TARGETED",
        level: activeEsc?.current_level ?? 0,
        escId: activeEsc?.id
      };
    }).slice(0, 5); // Just 5 like the mockup
  }, [members, escalations]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="font-display text-4xl text-red-600 animate-pulse uppercase tracking-[0.2em]">
          LOADING COMMAND CENTER...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-bricks bg-stone-900 flex flex-col p-8 font-mono text-white relative overflow-hidden">
      {/* Purple Slime Drips */}
      <div className="absolute top-0 inset-x-0 slime-drip-purple opacity-40 pointer-events-none z-0" />

      {/* Decorative Redstone Wire Path */}
      <div className="absolute top-0 right-[35%] w-1 h-[80%] bg-red-900/40 redstone-wire-glow pointer-events-none z-0" />
      <div className="absolute top-[80%] right-[35%] w-[40%] h-1 bg-red-900/40 redstone-wire-glow pointer-events-none z-0" />

      {/* --- TOP ROW: LOGO & PORTRAIT --- */}
      <header className="flex justify-between items-start mb-12 relative z-10">
        <div>
          <h1 className="text-karen-logo text-8xl mb-1 select-none">KAREN</h1>
          <p className="font-display text-stone-400 text-xs tracking-[0.3em] ml-2">COMMAND CENTER OF MALICE</p>
        </div>

        <div className="flex items-start gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <ProviderToggle />
              <div className="px-8 py-3 bg-stone-950 border-4 border-red-900 shadow-[0_0_20px_rgba(255,0,0,0.4)]">
                <span className="font-display text-base text-white tracking-widest animate-pulse">ACTIVE KAREN</span>
              </div>
            </div>
          </div>

          <div className="pixel-border-stone-deep p-4 relative group bg-stone-800">
            <div className="w-48 h-48 bg-stone-900 overflow-hidden border-4 border-stone-900 shadow-inner">
              <img
                src="/karen-portrait.png"
                alt="Karen Portrait"
                className="w-full h-full object-cover pixelated hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-stone-800 border-4 border-stone-900 flex items-center justify-center text-xl shadow-lg">🔥</div>
            <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-stone-800 border-4 border-stone-900 flex items-center justify-center text-xl shadow-lg">🔥</div>
          </div>
        </div>
      </header>

      {/* --- MIDDLE ROW: SIDEBAR & TABLE --- */}
      <div className="flex gap-16 flex-1 relative z-10">
        {/* Sidebar Buttons */}
        <aside className="w-56 flex flex-col gap-6 pt-12">
          <Link href="/open-matters" className="btn-pixel-action h-16 w-full text-lg">Target Logs</Link>
          <Link href="/karen" className="btn-pixel-action h-16 w-full text-lg">Arsenal</Link>
          <Link href="/join" className="btn-pixel-action h-16 w-full text-lg">Settings</Link>

          <div className="mt-auto relative h-40 border-l-4 border-red-900/40 pl-6 flex flex-col justify-end">
            <div className="absolute bottom-0 left-[-4px] w-4 h-4 bg-red-600 redstone-glow rounded-sm" />
            <div className="text-xs text-stone-600 font-bold uppercase tracking-[0.3em] pb-2">SYSTEM_STABLE</div>
            <div className="text-[10px] text-red-900 font-bold uppercase tracking-widest animate-pulse">READY_TO_UNLEASH</div>
          </div>
        </aside>

        {/* Main Target Tablet */}
        <main className="flex-1 max-w-2xl mt-8">
          <div className="pixel-table-frame overflow-hidden shadow-2xl">
            <div className="bg-stone-700 px-6 py-4 border-b-4 border-stone-900">
              <h2 className="font-display text-3xl text-center text-white tracking-[0.2em] uppercase">LIST OF TARGETS</h2>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-stone-800/80 font-display text-[10px] text-stone-500 uppercase tracking-[0.3em]">
                  <th className="py-4 pl-8 text-left">Icon</th>
                  <th className="py-4 text-left">Name</th>
                  <th className="py-4 pr-8 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="bg-stone-900/90 font-mono">
                {targetedMembers.map((m, idx) => (
                  <tr key={m.id} className="border-b-2 border-stone-800/50 hover:bg-stone-800/40 transition-colors group">
                    <td className="py-4 pl-8">
                      <div className="w-14 h-14 bg-stone-800 border-4 border-stone-900 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-md">
                        {m.avatar_emoji}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-stone-100 text-lg uppercase tracking-tight">{m.name}</div>
                      <div className="text-[10px] text-stone-600 font-black uppercase tracking-widest italic opacity-70">
                        {idx === 0 ? "MGR. BOB (McDonald's)" :
                          idx === 1 ? "CUSTOMER SERVICE #42" :
                            idx === 2 ? "CASHIER SALLY (Target)" :
                              idx === 3 ? "THE NEIGHBOR (Noise)" : "MANAGER CHAD (Costco)"}
                      </div>
                    </td>
                    <td className="py-4 pr-8 text-right">
                      <Link
                        href={m.escId ? `/escalation/${m.escId}` : "/trigger"}
                        className={`inline-block px-4 py-1.5 font-display text-[11px] uppercase border-2 shadow-sm transition-all active:scale-95 ${m.status === "ESCALATING" ? "bg-red-950/60 border-red-500 text-red-500 animate-pulse" :
                          m.status === "TARGETED" ? "bg-stone-800 border-red-900/60 text-red-800" :
                            "bg-stone-800 border-stone-700 text-stone-500"
                          }`}
                      >
                        {m.status}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-stone-800 h-2 w-full" />
          </div>
        </main>
      </div>

      {/* --- BOTTOM ROW: ACTION BUTTONS --- */}
      <footer className="mt-16 flex gap-12 items-end relative z-10 pb-12">
        {/* Release Button Wall */}
        <div className="pixel-border-stone-deep p-8 bg-stone-800 shadow-2xl relative">
          <Link
            href="/trigger"
            className="btn-pixel-action btn-release-red w-64 h-64 flex flex-col items-center justify-center gap-6 group"
          >
            <span className="font-display text-5xl text-center leading-[1.1] text-shadow-pixel">RELEASE THE KAREN</span>
            <div className="h-0.5 w-12 bg-white/20 group-hover:w-24 transition-all" />
            <span className="font-mono text-sm font-bold tracking-[0.3em] opacity-80 group-hover:opacity-100 transition-opacity">UNLEASH FURY</span>
          </Link>
          {/* Redstone dots */}
          <div className="absolute top-2 left-2 w-2 h-2 bg-red-600 animate-ping" />
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-red-600 animate-ping" />
        </div>

        {/* Action Grid */}
        <div className="flex-1 grid grid-cols-6 gap-6 h-64">
          <div className="col-span-3 row-span-1">
            <button className="btn-pixel-action w-full h-full bg-gradient-to-b from-purple-800 to-indigo-950 border-purple-500/50 text-2xl shadow-xl hover:brightness-125">
              <div className="flex flex-col">
                <span>EXECUTE ESCALATION</span>
                <span className="text-[10px] font-bold opacity-50 tracking-[0.2em] mt-2">TIER 5 COMPLAINT</span>
              </div>
            </button>
          </div>
          <div className="col-span-3 row-span-1">
            <button className="btn-pixel-action w-full h-full bg-gradient-to-b from-orange-800 to-red-950 border-orange-500/50 text-2xl redstone-glow shadow-xl hover:brightness-125">
              <div className="flex flex-col">
                <span>NUCLEAR FEDEX</span>
                <span className="text-[10px] font-bold opacity-50 tracking-[0.2em] mt-2">SEND DEMANDS</span>
              </div>
            </button>
          </div>

          <button className="col-span-2 btn-pixel-action h-20 text-xs bg-stone-700 hover:bg-stone-600">Manager Request</button>
          <button className="col-span-2 btn-pixel-action h-20 text-xs bg-stone-700 hover:bg-stone-600">Refund Bomb</button>
          <button className="col-span-2 btn-pixel-action h-20 text-xs bg-stone-700 hover:bg-stone-600">Write Yelp Rant</button>
        </div>
      </footer>

      {/* Torch Decorations */}
      <div className="absolute top-[25%] left-10 text-4xl select-none animate-pulse">🕯️</div>
      <div className="absolute top-[55%] right-10 text-4xl select-none animate-pulse" style={{ animationDelay: '1s' }}>🕯️</div>
      <div className="absolute bottom-[10%] left-[25%] text-4xl select-none animate-pulse" style={{ animationDelay: '1.5s' }}>🕯️</div>

      {/* Floating Particles (Embers) */}
      <AnimatePresence>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: 1000, opacity: 0 }}
            animate={{
              y: -100,
              opacity: [0, 1, 0],
              x: Math.sin(i) * 100
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 3
            }}
            className="absolute right-[10%] w-1 h-1 bg-red-500 z-0"
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
