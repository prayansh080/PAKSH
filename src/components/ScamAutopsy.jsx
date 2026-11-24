import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { ACCENTS, getSignalMeta } from '../lib/signals';

/**
 * ScamAutopsy — explains how each detected pattern appears to work.
 *
 * Every entry is grounded in a rules signal. Wording stays cautious
 * ("appears to", "may") and never claims to know the sender's intent.
 */
export function ScamAutopsy({ signals = [], reducedMotion: reducedMotionProp }) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? prefersReduced;
  const safeSignals = Array.isArray(signals) ? signals.filter(Boolean) : [];

  const entries = safeSignals.map((signal) => {
    const meta = getSignalMeta(signal.id);
    return {
      id: signal.id,
      title: meta.short,
      label: meta.label,
      severity: meta.severity,
      accent: ACCENTS[meta.accent] || ACCENTS.violet,
      evidence: signal.evidence || 'Evidence captured from the message.',
      autopsy: meta.autopsy,
      advice: meta.action
    };
  });

  return (
    <section aria-labelledby="autopsy-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="autopsy-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Autopsy</span>
            How the message appears to work
          </h3>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-faint">
            Explanations are tied to detected evidence, not assumptions about the sender.
          </p>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-4">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-safe" />
          <div>
            <p className="text-sm text-slate-300">No manipulation patterns detected.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              The message did not trigger the current rules. This is not a guarantee of legitimacy —
              verify the sender independently before acting.
            </p>
          </div>
        </div>
      ) : (
        <ol className="relative mt-4 space-y-3">
          {entries.map((entry, index) => (
            <motion.li
              key={entry.id}
              className="relative pl-10"
              initial={reducedMotion ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: reducedMotion ? 0 : index * 0.05 }}
            >
              {index < entries.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[-12px] left-[13px] top-8 w-px bg-line"
                />
              ) : null}
              <span
                className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border font-mono text-[10px] ${entry.accent.border} ${entry.accent.bg} ${entry.accent.text}`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <div className="rounded-xl border border-line bg-white/[0.02] p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-100">{entry.title}</p>
                  <span className={`font-mono text-[8px] uppercase tracking-[0.14em] ${entry.accent.text}`}>
                    {entry.severity}
                  </span>
                </div>
                <p className={`mt-2 border-l-2 pl-2.5 text-[11px] italic leading-relaxed text-slate-400 ${entry.accent.border}`}>
                  “{entry.evidence}”
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">{entry.autopsy}</p>
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-300">
                  <span className={`mt-[3px] h-1 w-1 flex-shrink-0 rounded-full ${entry.accent.dot}`} />
                  {entry.advice}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  );
}
