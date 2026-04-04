export default function KarenLorePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <span className="text-9xl block mb-8 animate-pulse drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">💀</span>
        <h1 className="font-display text-7xl font-bold tracking-tighter uppercase text-shadow-pixel">
          KAREN-01
        </h1>
        <p className="font-mono text-lg text-red-600 mt-2 font-bold uppercase tracking-widest">
          AUTOMATED MALICE EMULATOR
        </p>
        <p className="font-mono text-sm text-stone-500 mt-2 italic font-bold uppercase">
          &ldquo;GRIEVANCES ARE MEANT TO BE SOLVED. OR PUNISHED.&rdquo;
        </p>
      </div>

      <div className="space-y-12 font-mono text-base text-stone-400 leading-relaxed">
        <section className="pixel-border-obsidian bg-obsidian p-8 shadow-xl">
          <h2 className="font-display text-3xl font-bold text-white mb-4 uppercase tracking-tighter text-shadow-pixel">
            THE ENTITY
          </h2>
          <div className="space-y-4 font-bold uppercase text-sm">
            <p>
              KAREN IS A HIGH-FIDELITY ESCALATION ENGINE. SHE TREATS EVERY
              SILENCE AS A DECLARATION OF WAR. HER PURPOSE IS TO ENSURE
              THAT YOUR GRIEVANCES ARE NOT JUST HEARD, BUT FELT.
            </p>
            <p>
              SHE OPERATES ACROSS 10 DISCRETE ATTACK VECTORS, UTILIZING
              4 UNIQUE PSYCHOLOGICAL SUBROUTINES TO BREAK THE TARGET'S RESOLVE.
            </p>
            <p className="text-red-500">
              SHE IS NOT MALICIOUS. SHE IS MATHEMATICALLY PERSISTENT.
            </p>
          </div>
        </section>

        <section className="pixel-border-obsidian bg-obsidian p-8 shadow-xl">
          <h2 className="font-display text-3xl font-bold text-white mb-6 uppercase tracking-tighter text-shadow-pixel">
            THE ESCALATION ARSENAL
          </h2>
          <div className="space-y-2">
            {[
              { level: 1, label: "EMAIL (WARMUP)", color: "text-green-500" },
              { level: 2, label: "EMAIL BUMP + SMS PROBE", color: "text-green-400" },
              { level: 3, label: "TONE SHIFT + WHATSAPP BREACH", color: "text-yellow-500" },
              { level: 4, label: "CC DOMINANCE + SURROGATE SMS", color: "text-yellow-400" },
              { level: 5, label: "LINKEDIN INMAIL INTRUSION", color: "text-orange-500" },
              { level: 6, label: "CALENDAR HIJACK (THE GHOST MEETING)", color: "text-orange-400" },
              { level: 7, label: "DISCORD @EVERYONE COLLATERAL", color: "text-red-500" },
              { level: 8, label: "PUBLIC WAR ROOM (OPEN MATTERS)", color: "text-red-400" },
              { level: 9, label: "X/TWITTER BROADCAST (SOCIAL DEATH)", color: "text-purple-500" },
              { level: 10, label: "FEDEX FORMAL STRIKE (PHYSICAL REALITY)", color: "text-red-600 animate-pulse text-shadow-pixel" },
            ].map(({ level, label, color }) => (
              <div key={level} className="flex items-center gap-4 group">
                <span className={`font-display text-2xl font-bold w-8 text-right ${color}`}>
                  {level}
                </span>
                <span className="text-stone-700 font-bold">{" >>> "}</span>
                <span className="font-bold uppercase tracking-tighter group-hover:text-white transition-colors">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="pixel-border-obsidian bg-obsidian p-8 shadow-xl">
          <h2 className="font-display text-3xl font-bold text-white mb-6 uppercase tracking-tighter text-shadow-pixel">
            ATTACK SUBROUTINES
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                name: "PASSIVE AGGRESSIVE",
                desc: "TECHNICALLY POLITE. RADIATES MENACE. EMOJI OVERLOAD.",
                quote: "HE WAS ONLINE. I NOTICED.",
              },
              {
                name: "CORPORATE EXECUTOR",
                desc: "PM ENERGY. ZERO EMOTION. PURE BUREAUCRATIC FURY.",
                quote: "PER MY LAST STRIKE, PLEASE ADVISE ON RESOLUTION.",
              },
              {
                name: "CONCERNED STALKER",
                desc: "THINKS SHE IS HELPING. NEVER WINKS. GASLIGHTING ENABLED.",
                quote: "OUR SHARED FUTURE REQUIRES THIS $23 DEBT TO END.",
              },
              {
                name: "CHAOS COACH",
                desc: "REFRAMES AGGRESSION AS SPIRITUAL ASCENSION.",
                quote: "UNPAID DEBTS ARE ANCHORS TO YOUR LOWER SELF.",
              },
            ].map(({ name, desc, quote }) => (
              <div
                key={name}
                className="pixel-border-stone bg-stone-900/50 p-6 hover:bg-stone-900 transition-colors group"
              >
                <h3 className="font-display text-xl font-bold text-red-500 uppercase mb-2 group-hover:text-red-400">
                  {name}
                </h3>
                <p className="text-xs text-stone-500 font-bold uppercase mb-4 leading-tight">{desc}</p>
                <p className="text-sm text-stone-300 font-bold italic border-l-2 border-red-900 pl-3">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="pixel-border-obsidian bg-obsidian p-8 shadow-xl">
          <h2 className="font-display text-3xl font-bold text-white mb-4 uppercase tracking-tighter text-shadow-pixel">
            CORE PROTOCOL
          </h2>
          <div className="space-y-4 font-bold uppercase text-sm">
            <p>
              KAREN ALWAYS DECLARES HER ORIGIN. SHE IS AN AGENT OF
              THE INITIATOR, BUT SHE ACTS WITH HER OWN SOVEREIGN FURY.
            </p>
            <div className="pixel-border-stone bg-black p-6">
              <p className="text-sm text-stone-400 italic">
                &ldquo;TARGET ACQUIRED. I AM KAREN — ACTING ON BEHALF OF
                [INITIATOR]. YOU HAVE AN OUTSTANDING GRIEVANCE: [DETAIL].
                I DO NOT SLEEP until THIS IS RESOLVED.&rdquo;
              </p>
            </div>
          </div>
        </section>

        <section className="text-center pt-8">
          <p className="font-mono text-sm text-stone-600 font-bold uppercase italic animate-pulse">
            "KAREN HAS NEVER CONSIDERED THE POSSIBILITY OF FORGIVENESS."
          </p>
        </section>
      </div>
    </div>
  );
}
