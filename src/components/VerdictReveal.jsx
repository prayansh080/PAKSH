import { AlertTriangle, CheckCircle2, ShieldQuestion } from 'lucide-react';

/**
 * VerdictReveal — verdict identity block used inside the intelligence report.
 * The animated score lives in RiskGauge; this component states the verdict,
 * what it means, and the mandatory limitation.
 */

const VERDICTS = {
  'HIGH RISK': {
    icon: AlertTriangle,
    text: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/25',
    title: 'High risk',
    subtitle: 'Strong evidence of deception',
    disclaimer:
      'Strong indicators do not prove intent by themselves. Do not pay, share credentials, or open links until you verify independently.'
  },
  SUSPICIOUS: {
    icon: ShieldQuestion,
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    title: 'Suspicious',
    subtitle: 'Further verification recommended',
    disclaimer:
      'Some concerning patterns are present. Pause and verify the sender through an official channel before acting.'
  },
  'LOW RISK': {
    icon: CheckCircle2,
    text: 'text-safe',
    bg: 'bg-safe/10',
    border: 'border-safe/25',
    title: 'Low risk',
    subtitle: 'No significant scam signals detected',
    disclaimer:
      'Low risk does not guarantee legitimacy. Always verify the sender independently.'
  }
};

export function VerdictReveal({ verdict = 'LOW RISK', compact = false }) {
  const config = VERDICTS[verdict] || VERDICTS['LOW RISK'];
  const Icon = config.icon;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${config.text} ${config.bg} ${config.border}`}
      >
        <Icon className="h-3 w-3" />
        {verdict}
      </span>
    );
  }

  return (
    <div className={`rounded-xl border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${config.border} bg-ink/40 ${config.text}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-semibold uppercase tracking-[0.14em] ${config.text}`}>
            {config.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{config.subtitle}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{config.disclaimer}</p>
        </div>
      </div>
    </div>
  );
}
