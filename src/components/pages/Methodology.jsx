import { PageLayout, eyebrowStyles, labelStyles } from '../PageLayout';
import {
  ArrowRight,
  BrainCircuit,
  Fingerprint,
  Globe2,
  Lock,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const LAYERS = [
  {
    id: 'rules',
    icon: BrainCircuit,
    title: 'Layer 1 — Local rules engine',
    status: 'Always on',
    tone: 'cyan',
    body: 'Deterministic pattern matching runs in your browser. Six scam patterns are tested with fixed weights. The same message always produces the same score. Works offline, requires no API keys.'
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'Layer 2 — AI explanation',
    status: 'Optional',
    tone: 'violet',
    body: 'A server-side language model can provide a plain-language explanation of the detected signals. It can describe what it sees, but it cannot change the risk score or verdict. The report says plainly when AI was not used.'
  },
  {
    id: 'reputation',
    icon: Globe2,
    title: 'Layer 3 — External reputation',
    status: 'Optional',
    tone: 'electric',
    body: 'Google Safe Browsing can corroborate whether a URL appears on known threat lists. Results are shown separately and never alter the deterministic score. Without a server-side API key, the panel reports "Not configured" honestly.'
  }
];

const SIGNALS = [
  {
    id: 'otp-request',
    icon: Fingerprint,
    title: 'OTP / credential request',
    weight: '+30',
    tone: 'danger',
    description: 'Requests for OTP, PIN, CVV, password, Aadhaar, PAN, or card details.'
  },
  {
    id: 'upfront-payment',
    icon: WalletIcon,
    title: 'Upfront payment demand',
    weight: '+25',
    tone: 'danger',
    description: 'Requests for registration fees, deposits, processing charges, or advance payments.'
  },
  {
    id: 'suspicious-url',
    icon: Globe2,
    title: 'Suspicious link',
    weight: '+20',
    tone: 'danger',
    description: 'Shortened, non-HTTPS, lookalike, brand-like, or raw-IP URLs.'
  },
  {
    id: 'impersonation',
    icon: ShieldAlertIcon,
    title: 'Authority impersonation',
    weight: '+15',
    tone: 'violet',
    description: 'Claims to be from a bank, company, government body, or courier service.'
  },
  {
    id: 'urgency',
    icon: ClockIcon,
    title: 'Artificial urgency',
    weight: '+10',
    tone: 'amber',
    description: 'Time pressure such as "today only", "account blocked", or "last chance".'
  },
  {
    id: 'off-platform',
    icon: ArrowRight,
    title: 'Off-platform contact',
    weight: '+10',
    tone: 'violet',
    description: 'Pushes contact to Telegram, WhatsApp-only, or personal recruiter email.'
  }
];

const VERDICTS = [
  {
    id: 'high',
    title: 'HIGH RISK',
    threshold: '>= 30',
    tone: 'danger',
    description: 'Strong evidence of deception: credential theft, upfront payment, or multiple signals.'
  },
  {
    id: 'suspicious',
    title: 'SUSPICIOUS',
    threshold: '>= 20',
    tone: 'amber',
    description: 'Moderate evidence: urgency, impersonation, or suspicious URL.'
  },
  {
    id: 'low',
    title: 'LOW RISK',
    threshold: '< 20',
    tone: 'safe',
    description: 'Weak or no evidence. Never a guarantee of safety.'
  }
];

export default function Methodology() {
  return (
    <PageLayout
      title="Methodology"
      subtitle="How PAKSH works — the rules, the AI layer, the limitations, and the evidence process."
      breadcrumb="Methodology"
    >
      <section>
        <p className="eyebrow-cyan">Architecture</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-white sm:text-2xl">
          Three separate intelligence layers
        </h2>
        <p className="mt-1.5 text-slate-400 text-sm">
          PAKSH keeps detection, explanation, and reputation clearly separated. Only the first layer
          decides the score.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
        {LAYERS.map((layer) => {
          const Icon = layer.icon;
          return (
            <div key={layer.id} className="panel-soft p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-current/15 bg-white/[0.02]">
                  <Icon className={`h-4 w-4 ${layer.tone === 'cyan' ? 'text-cyan' : layer.tone === 'violet' ? 'text-violet' : 'text-sky-300'}`} />
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] ${
                    layer.status === 'Always on'
                      ? 'border-safe/25 bg-safe/[0.06] text-safe'
                      : 'border-violet/25 bg-violet/[0.06] text-violet'
                  }`}
                >
                  {layer.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{layer.title}</h3>
              <p className="text-[11px] leading-relaxed text-slate-400">{layer.body}</p>
            </div>
          );
        })}
      </div>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-cyan">Signal weights</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Deterministic signal weights
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {SIGNALS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="rounded-xl border border-line bg-white/[0.01] p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg border border-current/15 bg-white/[0.02]`}>
                      <Icon className={`h-3.5 w-3.5 ${s.tone === 'danger' ? 'text-danger' : s.tone === 'violet' ? 'text-violet' : s.tone === 'amber' ? 'text-amber-400' : 'text-cyan'}`} />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                      {s.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-300">{s.weight}</span>
                </div>
                <p className="text-[10px] leading-relaxed text-slate-400">{s.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-cyan">Verdict thresholds</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              How the verdict is decided
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {VERDICTS.map((v) => {
            return (
              <div
                key={v.id}
                className={`rounded-xl border p-4 ${
                  v.id === 'high'
                    ? 'border-danger/25 bg-danger/[0.03]'
                    : v.id === 'suspicious'
                      ? 'border-amber-500/25 bg-amber-500/[0.03]'
                      : 'border-safe/25 bg-safe/[0.03]'
                }`}
              >
                <h3 className="text-sm font-semibold">
                  <span className={v.id === 'high' ? 'text-danger' : v.id === 'suspicious' ? 'text-amber-400' : 'text-safe'}>
                    {v.title}
                  </span>
                </h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Threshold: {v.threshold}
                </p>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-400">{v.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 text-cyan flex-shrink-0" />
          <div>
            <p className="eyebrow-cyan">Honesty and limitations</p>
            <h3 className="mt-0.5 text-sm font-semibold text-white">What PAKSH does not do</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              <li>Does not verify sender identity or message history.</li>
              <li>Does not follow redirects, check domain age, or query WHOIS/DNS.</li>
              <li>Does not fabricate database results or threat-feed information.</li>
              <li>Does not let AI change the risk score or verdict.</li>
              <li>Does not claim a clean URL is safe — only that no local pattern was found.</li>
            </ul>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}

function WalletIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M22 7H2" />
    </svg>
  );
}

function ShieldAlertIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
