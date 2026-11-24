import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bug, ShieldAlert, ShieldCheck, Terminal } from 'lucide-react';

import { PageLayout } from '../PageLayout';

const LAB_CASES = [
  {
    id: 'internship',
    title: 'Fake Internship Offer',
    icon: BriefcaseIcon,
    tone: 'danger',
    category: 'Job scam',
    text: 'Congratulations! You are selected for a paid internship at Infosys. Pay ₹1,499 registration fee today to confirm your position. Contact HR on Telegram: @infosys_hr. Today only!',
    expected: 'HIGH RISK',
    signals: ['Upfront payment demand', 'Artificial urgency', 'Off-platform contact'],
    lesson: 'Legitimate internships never ask for payment to confirm a role, and recruiters do not move hiring to Telegram.'
  },
  {
    id: 'kyc',
    title: 'KYC Update Phishing',
    icon: ShieldAlert,
    tone: 'danger',
    category: 'Banking scam',
    text: 'Dear customer, your SBI account will be blocked today. Complete KYC immediately at http://sbi-verify.xyz/kyc to avoid suspension.',
    expected: 'HIGH RISK',
    signals: ['Suspicious link', 'Authority impersonation', 'Artificial urgency'],
    lesson: 'Banks never ask you to complete KYC via an SMS link. Shortened or lookalike domains are a classic phishing signal.'
  },
  {
    id: 'otp',
    title: 'OTP Theft Attempt',
    icon: ShieldAlert,
    tone: 'danger',
    category: 'Credential theft',
    text: 'Share your OTP to verify your bank account or it will be blocked within 24 hours.',
    expected: 'HIGH RISK',
    signals: ['OTP / credential request', 'Artificial urgency'],
    lesson: 'No bank or company will ever ask for your OTP, PIN, CVV, or password over SMS or WhatsApp.'
  },
  {
    id: 'courier',
    title: 'Courier / Customs Scam',
    icon: Terminal,
    tone: 'danger',
    category: 'Delivery scam',
    text: 'Your parcel is stuck at customs. Pay ₹500 clearance fee to release it. Contact on WhatsApp only.',
    expected: 'SUSPICIOUS',
    signals: ['Upfront payment demand', 'Off-platform contact', 'Authority impersonation'],
    lesson: 'Customs authorities do not demand clearance fees via WhatsApp. This is an advance-fee scam pattern.'
  },
  {
    id: 'investment',
    title: 'Fake Investment Opportunity',
    icon: Bug,
    tone: 'danger',
    category: 'Investment fraud',
    text: 'Guaranteed 20% monthly returns on crypto investment. Limited slots available. Pay activation fee of ₹5,000 to start.',
    expected: 'HIGH RISK',
    signals: ['Upfront payment demand', 'Artificial urgency', 'Authority impersonation'],
    lesson: 'Guaranteed high returns with an activation fee is a classic investment scam. There are no risk-free profits.'
  },
  {
    id: 'scholarship',
    title: 'Scholarship Fraud',
    icon: ShieldCheck,
    tone: 'danger',
    category: 'Education scam',
    text: 'Congratulations! You won a scholarship. Pay processing fee of ₹2,000 to claim. Email hr@gmail.com now.',
    expected: 'SUSPICIOUS',
    signals: ['Upfront payment demand', 'Off-platform contact'],
    lesson: 'Real scholarships do not require processing fees, and official organizations do not use personal Gmail addresses.'
  },
  {
    id: 'safe',
    title: 'Safe College Announcement',
    icon: ShieldCheck,
    tone: 'safe',
    category: 'Legitimate',
    text: 'Notice: The annual college fest will be held on 12 March in the main campus auditorium. All students are welcome. Details on the notice board.',
    expected: 'LOW RISK',
    signals: [],
    lesson: 'Official campus announcements with no payment requests, no shortened links, and no urgency are typically safe — but always verify independently.'
  }
];

export default function ThreatLab() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <PageLayout
      title="PAKSH Threat Lab"
      subtitle="Labelled fictional scam demonstrations. Select an example to see why PAKSH flags it, then run it through the scanner."
      breadcrumb="Threat Lab"
    >
      <div>
        <p className="eyebrow-cyan">Demonstration cases</p>
        <p className="mt-1.5 max-w-3xl text-slate-400 text-sm">
          All examples below are fictional demonstrations. They are designed to show how PAKSH detects
          different scam patterns. None of these messages were sent by real organizations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LAB_CASES.map((caze) => {
          const isSelected = selectedId === caze.id;
          return (
            <button
              key={caze.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedId(caze.id)}
              className={`group relative w-full rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-cyan/50 bg-cyan/[0.03] shadow-glow'
                  : caze.tone === 'safe'
                    ? 'border-safe/20 bg-safe/[0.02] hover:border-safe/40 hover:bg-safe/[0.05]'
                    : 'border-line bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg border border-current/15 bg-white/[0.02]`}>
                    <caze.icon className="h-4 w-4" />
                  </div>
                  <span className={`font-mono text-[9px] uppercase tracking-[0.12em] ${
                    caze.tone === 'safe' ? 'text-safe' : 'text-danger'
                  }`}>
                    {caze.category}
                  </span>
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-[0.12em] ${
                    caze.tone === 'safe' ? 'text-safe' : 'text-danger'
                  }`}
                >
                  {caze.expected}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-white group-hover:text-cyan transition-colors mb-1">
                {caze.title}
              </h3>
              <p className="text-[10px] leading-relaxed text-slate-400 mb-3 line-clamp-2">
                {caze.text}
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {caze.signals.map((signal) => (
                  <span
                    key={signal}
                    className="rounded border border-line bg-white/[0.02] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-faint"
                  >
                    {signal}
                  </span>
                ))}
              </div>


            </button>
          );
        })}
      </div>

      {selectedId ? (
        <section className="panel animate-[fade-up_0.35s_ease-out] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan" />
              <span className="font-mono text-xs text-cyan">Selected case</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs text-faint hover:text-white transition-colors"
            >
              Clear selection
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
            <div>
              <div className="rounded-xl border border-line bg-white/[0.02] p-4 mb-4">
                <p className="label mb-1">Example message</p>
                <div className="rounded-lg border border-line bg-ink/50 p-3 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-line break-words">
                  {LAB_CASES.find((c) => c.id === selectedId)?.text}
                </div>
              </div>

              <div className="space-y-3">
                <p className="label">What to look for</p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  {LAB_CASES.find((c) => c.id === selectedId)?.lesson}
                </p>

                <div className="mt-4 rounded-lg border border-line bg-white/[0.02] p-3">
                  <p className="label mb-2">Expected detection</p>
                  <div className="flex flex-wrap gap-2">
                    {LAB_CASES.find((c) => c.id === selectedId)?.signals.map((s) => (
                      <span key={s} className="rounded border border-line bg-white/[0.02] px-2 py-0.5 font-mono text-[9px] text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/scanner"
                onClick={() => {
                  const caze = LAB_CASES.find((c) => c.id === selectedId);
                  if (caze) {
                    // Store the sample in session storage so the scanner can pick it up
                    sessionStorage.setItem('paksh-sample', caze.text);
                  }
                }}
                className="btn-primary"
              >
                Run in scanner
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="btn-ghost text-xs !px-3 !py-2"
              >
                Choose another case
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </PageLayout>
  );
}

function BriefcaseIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
