import { AlertTriangle, ArrowRight, CheckCircle2, KeyRound, Wallet } from 'lucide-react';

/**
 * ReportPreview — a static, clearly-labelled illustration of the report format.
 *
 * This is not a live analysis and does not claim to be. It exists so a first-time
 * visitor understands the output before pasting a real message.
 */

const PREVIEW_SIGNALS = [
  {
    id: 'payment',
    icon: Wallet,
    label: 'Upfront payment demand',
    weight: '+25',
    evidence: 'Pay ₹1,499 today to confirm your position.',
    tone: 'border-amber-500/25 bg-amber-500/[0.06] text-amber-400'
  },
  {
    id: 'urgency',
    icon: AlertTriangle,
    label: 'Artificial urgency',
    weight: '+10',
    evidence: 'today',
    tone: 'border-amber-500/25 bg-amber-500/[0.06] text-amber-400'
  },
  {
    id: 'otp',
    icon: KeyRound,
    label: 'Off-platform contact',
    weight: '+10',
    evidence: 'Contact HR on Telegram',
    tone: 'border-violet/25 bg-violet/[0.06] text-violet'
  }
];

export function ReportPreview() {
  return (
    <section id="report-preview" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-violet">Report preview</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            What you get back.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            A verdict, a score, the exact evidence, the scam pattern, and a next action — in that
            order.
          </p>
        </div>
        <span className="chip">Illustrative example</span>
      </div>

      <div className="panel mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-ink/40 px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-300">
              Sample · fake internship offer
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            Static preview, not a live scan
          </span>
        </div>

        <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="border-b border-line p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-center gap-4">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-danger/25 bg-danger/[0.06]">
                <div className="absolute inset-1.5 rounded-full border-2 border-danger/30 border-t-danger" />
                <span className="text-2xl font-semibold text-danger">35</span>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-danger">High risk</p>
                <p className="mt-1 text-sm font-semibold text-white">Strong evidence</p>
                <p className="mt-0.5 text-[10px] text-faint">3 signals · rules engine</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-danger/20 bg-danger/[0.05] px-3 py-2">
              <p className="text-[10px] leading-relaxed text-slate-300">
                Do not pay, share credentials, or open links until you verify independently.
              </p>
            </div>

            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
              Indicator score — not a probability of fraud
            </p>
          </div>

          <div className="p-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-cyan">Evidence</p>
            <p className="mt-2 rounded-lg border border-line bg-ink/50 p-3 text-[12px] leading-6 text-slate-300">
              Selected for internship.{' '}
              <mark className="rounded-[3px] bg-amber-500/15 px-0.5 text-amber-300 ring-1 ring-inset ring-amber-500/30">
                Pay ₹1,499 today
              </mark>{' '}
              to confirm your position.{' '}
              <mark className="rounded-[3px] bg-violet/15 px-0.5 text-violet ring-1 ring-inset ring-violet/30">
                Contact HR on Telegram
              </mark>
              .
            </p>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {PREVIEW_SIGNALS.map((signal) => {
                const Icon = signal.icon;
                return (
                  <div key={signal.id} className={`rounded-lg border p-2.5 ${signal.tone}`}>
                    <div className="flex items-center justify-between gap-1">
                      <Icon className="h-3 w-3" />
                      <span className="font-mono text-[9px]">{signal.weight}</span>
                    </div>
                    <p className="mt-1.5 text-[10px] font-medium text-slate-200">{signal.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-safe/20 bg-safe/[0.04] px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-safe" />
              <p className="text-[10px] leading-relaxed text-slate-300">
                <span className="font-medium text-slate-100">Next action:</span> do not pay. Verify the
                internship on the company&apos;s official careers page.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <a href="#scan" className="btn-primary">
          Analyse your own message
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
