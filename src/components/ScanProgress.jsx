import { motion, useReducedMotion } from 'framer-motion';
import { Check, Circle, Loader2, Minus, Radar } from 'lucide-react';

/**
 * ScanProgress — staged analysis display driven by real application state.
 *
 * Each stage receives a status from App:
 *   done | active | pending | skipped
 *
 * No stage invents a result. Details (signal count, score, link count) come
 * from the actual rules engine output.
 */

function StatusIcon({ status, reducedMotion }) {
  if (status === 'done') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan/30 bg-cyan/10 text-cyan">
        <Loader2 className={`h-3.5 w-3.5 ${reducedMotion ? '' : 'animate-spin'}`} />
      </span>
    );
  }
  if (status === 'skipped') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white/[0.02] text-faint">
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white/[0.02] text-faint">
      <Circle className="h-2.5 w-2.5" />
    </span>
  );
}

export function ScanProgress({ stages = [], reducedMotion: reducedMotionProp }) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? prefersReduced;

  const total = stages.length || 1;
  const done = stages.filter((stage) => stage.status === 'done' || stage.status === 'skipped').length;
  const pct = Math.round((done / total) * 100);

  return (
    <motion.section
      aria-live="polite"
      aria-label="Analysis progress"
      className="panel overflow-hidden"
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Radar className={`h-4 w-4 text-cyan ${reducedMotion ? '' : 'animate-spin-slow'}`} />
          <span className="eyebrow text-cyan">Analysis in progress</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          {done}/{total} steps
        </span>
      </div>

      <div className="px-5 pt-4">
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan via-sky-400 to-electric"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }}
          />
        </div>
      </div>

      <ol className="space-y-1 px-5 py-4">
        {stages.map((stage) => {
          const isActive = stage.status === 'active';
          return (
            <li
              key={stage.id}
              className={`flex items-start gap-3 rounded-xl px-2 py-2 transition-colors ${
                isActive ? 'bg-cyan/[0.04]' : ''
              }`}
            >
              <StatusIcon status={stage.status} reducedMotion={reducedMotion} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span
                    className={`text-sm ${
                      stage.status === 'pending'
                        ? 'text-faint'
                        : stage.status === 'skipped'
                          ? 'text-muted'
                          : 'text-slate-200'
                    }`}
                  >
                    {stage.label}
                  </span>
                  {stage.detail ? (
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                      {stage.detail}
                    </span>
                  ) : null}
                </div>
                {isActive && !reducedMotion ? (
                  <div className="mt-2 h-px overflow-hidden bg-white/[0.04]">
                    <div className="h-full w-1/3 animate-scan-sweep bg-gradient-to-r from-transparent via-cyan to-transparent" />
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-faint">
        Stages reflect the actual analysis state. The rules score is deterministic; AI context is
        optional and never changes it.
      </p>
    </motion.section>
  );
}
