import { motion, useReducedMotion } from 'framer-motion';
import {
  Check,
  KeyRound,
  Link2,
  MessageSquareWarning,
  Timer,
  UserX,
  Wallet
} from 'lucide-react';
import {
  ACCENTS,
  SCAM_STAGES,
  getActiveStageIds,
  getSignalMeta
} from '../lib/signals';

const STAGE_ICONS = {
  datatheft: KeyRound,
  paymenttrap: Wallet,
  fakeauthority: UserX,
  urgency: Timer,
  offplatform: MessageSquareWarning,
  linktrap: Link2
};

/**
 * ScamDNA — evidence-backed scam pattern map.
 *
 * A stage activates only when a matching rules signal exists. Inactive stages
 * stay visible but quiet, so the map never implies evidence that is not there.
 */
export function ScamDNA({ signals = [], reducedMotion: reducedMotionProp }) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? prefersReduced;
  const safeSignals = Array.isArray(signals) ? signals.filter(Boolean) : [];
  const activeIds = getActiveStageIds(safeSignals);
  const activeCount = activeIds.size;

  return (
    <section aria-labelledby="scam-dna-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="scam-dna-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet">DNA</span>
            Scam pattern map
          </h3>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-faint">
            Each stage is supported by a detected signal. Empty stages are not evidence of absence.
          </p>
        </div>
        <span className="chip">
          {activeCount} / {SCAM_STAGES.length} stages supported
        </span>
      </div>

      {activeCount === 0 ? (
        <div className="mt-4 rounded-xl border border-line bg-white/[0.02] px-4 py-6 text-center">
          <p className="text-sm text-slate-300">No clear scam sequence detected from the available evidence.</p>
          <p className="mt-1 text-[11px] text-faint">
            Low risk does not guarantee legitimacy. Always verify the sender independently.
          </p>
        </div>
      ) : null}

      <ol className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <span
          aria-hidden="true"
          className="absolute left-5 right-5 top-5 hidden h-px bg-line lg:block"
        />
        {SCAM_STAGES.map((stage, index) => {
          const active = activeIds.has(stage.id);
          const accent = ACCENTS[stage.accent] || ACCENTS.violet;
          const Icon = STAGE_ICONS[stage.id] || Link2;
          const supportingSignal = safeSignals.find((signal) =>
            stage.signalIds.includes(signal && signal.id)
          );
          const supportingMeta = supportingSignal ? getSignalMeta(supportingSignal.id) : null;

          return (
            <motion.li
              key={stage.id}
              data-stage={stage.id}
              data-active={active ? 'true' : 'false'}
              className={`relative flex gap-3 rounded-xl border p-3 transition-colors lg:flex-col lg:items-start lg:gap-2 ${
                active
                  ? `${accent.border} ${accent.soft}`
                  : 'border-line bg-white/[0.015]'
              }`}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: reducedMotion ? 0 : index * 0.05 }}
            >
              <div className="relative z-10 flex-shrink-0">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                    active
                      ? `${accent.border} ${accent.bg} ${accent.text}`
                      : 'border-line bg-ink text-faint'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {active ? (
                  <span
                    className={`absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-ink bg-ink ${accent.text}`}
                    aria-hidden="true"
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                ) : null}
              </div>

              <div className="min-w-0">
                <p className={`text-xs font-medium ${active ? 'text-slate-100' : 'text-faint'}`}>
                  {stage.label}
                </p>
                <p className={`mt-1 text-[10px] leading-relaxed ${active ? 'text-slate-400' : 'text-faint/80'}`}>
                  {stage.description}
                </p>
                <div className="mt-2">
                  {active && supportingMeta ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] ${accent.bg} ${accent.border} ${accent.text}`}
                    >
                      <span className={`h-1 w-1 rounded-full ${accent.dot}`} />
                      {supportingMeta.short}
                    </span>
                  ) : (
                    <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-faint">
                      Not detected
                    </span>
                  )}
                </div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
