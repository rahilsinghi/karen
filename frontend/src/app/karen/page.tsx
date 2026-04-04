export default function KarenLorePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="text-center mb-12">
        <span className="text-8xl block mb-6">🦞</span>
        <h1 className="font-display text-5xl font-bold tracking-tight">
          KAREN
        </h1>
        <p className="font-mono text-sm text-karen mt-2">
          Automated Correspondence Systems LLC
        </p>
        <p className="font-mono text-xs text-muted mt-1">
          &ldquo;Karen gets results.&rdquo;
        </p>
      </div>

      <div className="space-y-8 font-mono text-sm text-text/80 leading-relaxed">
        <section>
          <h2 className="font-display text-lg font-semibold text-text mb-3">
            Who is Karen?
          </h2>
          <p>
            Karen is a professional follow-up agent. She treats every
            non-response as a crisis and every crisis as an opportunity to
            escalate — across 10 channels, with 4 distinct personalities,
            against anyone in The Circle.
          </p>
          <p className="mt-2">
            She is not malicious. She is not insecure. She is deeply,
            committedly, professionally unhinged. She means well. She always
            has.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-text mb-3">
            The 10-Level Escalation Ladder
          </h2>
          <div className="space-y-1">
            {[
              { level: 1, label: "Email (warm)", color: "text-level-green" },
              { level: 2, label: "Email bump + SMS", color: "text-level-green" },
              { level: 3, label: "Email tone shift + WhatsApp", color: "text-level-yellow" },
              { level: 4, label: "Email CC + SMS to CC'd person", color: "text-level-yellow" },
              { level: 5, label: "LinkedIn InMail", color: "text-level-orange" },
              { level: 6, label: "Google Calendar event", color: "text-level-orange" },
              { level: 7, label: "Discord @everyone", color: "text-level-red" },
              { level: 8, label: "Open Matters (public)", color: "text-level-red" },
              { level: 9, label: "Twitter/X post", color: "text-level-purple" },
              { level: 10, label: "FedEx formal letter", color: "text-level-nuclear glow-nuclear" },
            ].map(({ level, label, color }) => (
              <div key={level} className="flex items-center gap-3">
                <span className={`font-bold w-6 text-right ${color}`}>
                  {level}
                </span>
                <span className="text-muted">—</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-text mb-3">
            Karen&apos;s 4 Personalities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                name: "Passive Aggressive",
                desc: "Technically polite. Radiates menace. Escalates emojis.",
                quote: "He was online. I noticed.",
              },
              {
                name: "Corporate",
                desc: "Project manager energy. Zero emotional acknowledgment.",
                quote: "Per my last communication, please advise on timeline.",
              },
              {
                name: "Genuinely Concerned",
                desc: "Thinks she is helping. Never winks. Believes she is saving the friendship.",
                quote: "$23 is not worth a friendship. Please resolve this.",
              },
              {
                name: "Life Coach",
                desc: "Reframes every escalation as personal growth.",
                quote: "Unresolved financial obligations create energetic blocks.",
              },
            ].map(({ name, desc, quote }) => (
              <div
                key={name}
                className="border border-border rounded-sm p-4 bg-surface"
              >
                <h3 className="font-display font-semibold text-sm text-karen">
                  {name}
                </h3>
                <p className="text-xs text-muted mt-1">{desc}</p>
                <p className="text-xs text-text/60 mt-2 italic">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-text mb-3">
            How Karen Works
          </h2>
          <p>
            Karen always identifies herself. She never impersonates anyone. She
            sends messages AS herself, ON BEHALF OF the initiator.
          </p>
          <div className="border border-border rounded-sm bg-bg p-4 mt-3">
            <p className="text-xs text-muted italic">
              &ldquo;Hi [target], I&apos;m Karen — reaching out on behalf of
              [initiator] about [grievance]. [initiator] has asked me to follow
              up.&rdquo;
            </p>
          </div>
        </section>

        <section className="text-center pt-4">
          <p className="text-xs text-muted">
            Karen has never once considered that maybe the other person is just
            busy.
          </p>
        </section>
      </div>
    </div>
  );
}
