import {
  ExternalLink,
  KeyRound,
  Link2,
  MessageSquareWarning,
  Phone,
  ShieldCheck,
  Timer,
  UserX,
  Wallet
} from 'lucide-react';
import { ACCENTS, SIGNAL_ORDER, getSignalMeta } from '../lib/signals';

const SIGNAL_ICONS = {
  'otp-request': KeyRound,
  'upfront-payment': Wallet,
  'suspicious-url': Link2,
  impersonation: UserX,
  urgency: Timer,
  'off-platform': MessageSquareWarning
};

/**
 * SafetyActions — concrete next steps derived from detected signals.
 *
 * Shows India-specific reporting resources only when risk is elevated.
 * PAKSH never claims to report, block, or contact anyone on the user's behalf.
 */
export function SafetyActions({ signals = [], verdict = 'LOW RISK' }) {
  const safeSignals = Array.isArray(signals) ? signals.filter(Boolean) : [];
  const ids = new Set(safeSignals.map((signal) => signal && signal.id));

  const actions = SIGNAL_ORDER.filter((id) => ids.has(id)).map((id) => {
    const meta = getSignalMeta(id);
    return { id, meta, accent: ACCENTS[meta.accent] || ACCENTS.violet, Icon: SIGNAL_ICONS[id] || ShieldCheck };
  });

  const showResources = verdict === 'HIGH RISK' || verdict === 'SUSPICIOUS';

  return (
    <section aria-labelledby="safety-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="safety-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-safe">Action</span>
            What to do next
          </h3>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-faint">
            Practical steps tied to the evidence above.
          </p>
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-safe" />
          <div>
            <p className="text-sm text-slate-300">No specific safety action was triggered.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              Verify the sender independently before sharing details or making a payment.
            </p>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {actions.map(({ id, meta, accent, Icon }) => (
            <li key={id} className={`flex gap-3 rounded-xl border p-3 ${accent.border} ${accent.soft}`}>
              <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border ${accent.border} bg-ink/50 ${accent.text}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-100">{meta.short}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{meta.action}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showResources ? (
        <div className="mt-4 rounded-xl border border-cyan/20 bg-cyan/[0.04] p-3.5">
          <p className="label text-cyan">If you already acted</p>
          <div className="mt-2 space-y-2">
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg border border-line bg-ink/40 px-2.5 py-2 text-[11px] text-slate-300 transition-colors hover:border-cyan/30 hover:text-white"
            >
              <span>Report on the National Cyber Crime Portal</span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
            <a
              href="tel:1930"
              className="flex items-center justify-between gap-2 rounded-lg border border-line bg-ink/40 px-2.5 py-2 text-[11px] text-slate-300 transition-colors hover:border-cyan/30 hover:text-white"
            >
              <span>Call the 1930 financial-fraud helpline</span>
              <Phone className="h-3 w-3 flex-shrink-0" />
            </a>
            <p className="px-1 text-[10px] leading-relaxed text-faint">
              Also contact your bank using the official number on its website or card.
            </p>
          </div>
          <p className="mt-2 px-1 text-[10px] leading-relaxed text-faint">
            PAKSH does not report, block, or contact anyone on your behalf.
          </p>
        </div>
      ) : null}
    </section>
  );
}
