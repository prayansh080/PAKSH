import {
  ArrowRight,
  BrainCircuit,
  Fingerprint,
  Globe2,
  KeyRound,
  Layers,
  ScanSearch,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

/**
 * HowItWorks — explains the pipeline and the three separate intelligence layers.
 *
 * Wording is deliberately precise about what runs where. No layer is described
 * as doing more than it actually does.
 */

const STEPS = [
  {
    id: 'message',
    icon: ScanSearch,
    title: 'Message',
    body: 'You paste an SMS, WhatsApp message, offer, or link. The rules engine runs in your browser.'
  },
  {
    id: 'signals',
    icon: KeyRound,
    title: 'Signals',
    body: 'Six patterns are tested: OTP request, upfront payment, suspicious link, impersonation, urgency, off-platform contact.'
  },
  {
    id: 'risk',
    icon: Layers,
    title: 'Risk',
    body: 'Fixed weights produce a 0–100 indicator. The same message always produces the same score.'
  },
  {
    id: 'evidence',
    icon: Fingerprint,
    title: 'Evidence',
    body: 'Only exact phrases that triggered a rule are highlighted inside your original message.'
  },
  {
    id: 'pattern',
    icon: Sparkles,
    title: 'Pattern',
    body: 'Detected signals map to a ScamDNA stage, so the shape of the attempt becomes visible.'
  },
  {
    id: 'action',
    icon: ShieldCheck,
    title: 'Action',
    body: 'You get concrete next steps, plus reporting resources when money or credentials are involved.'
  }
];

const LAYERS = [
  {
    id: 'rules',
    icon: ScanSearch,
    title: 'Local rules engine',
    status: 'Always on',
    tone: 'cyan',
    body: 'Deterministic pattern matching in your browser. It produces the score and verdict, and works with no API keys and no network.'
  },
  {
    id: 'ai',
    icon: BrainCircuit,
    title: 'AI context',
    status: 'Optional',
    tone: 'violet',
    body: 'A server-side language model can add a plain-language explanation. It never changes the score, and the report says plainly when it was not used.'
  },
  {
    id: 'reputation',
    icon: Globe2,
    title: 'External reputation',
    status: 'Optional',
    tone: 'electric',
    body: 'Google Safe Browsing can corroborate links server-side. Results are shown separately and never alter the deterministic score.'
  }
];

const TONE = {
  cyan: 'border-cyan/25 bg-cyan/[0.05] text-cyan',
  violet: 'border-violet/25 bg-violet/[0.05] text-violet',
  electric: 'border-sky-400/25 bg-sky-400/[0.05] text-sky-300'
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-cyan">Method</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            From message to action, without guessing.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            PAKSH separates what it detects, why it matters, and what you should do. Every claim in a
            report traces back to a rule or an explicitly labelled source.
          </p>
        </div>
        <a href="#scan" className="btn-ghost">
          Try the scanner
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.id} className="panel-soft relative overflow-hidden p-4">
              <span className="pointer-events-none absolute right-3 top-2 font-mono text-3xl font-semibold text-white/[0.04]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan">
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{step.body}</p>
            </li>
          );
        })}
      </ol>

      <div className="panel mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow text-slate-300">Three separate layers</p>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              Only the first layer decides the score. The other two are labelled context.
            </p>
          </div>
          <span className="chip">No fabricated database results</span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            return (
              <div key={layer.id} className={`rounded-xl border p-3.5 ${TONE[layer.tone]}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-ink/40">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full border border-line bg-ink/40 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]">
                    {layer.status}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-100">{layer.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{layer.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
