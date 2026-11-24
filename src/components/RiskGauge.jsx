import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * RiskGauge — animated deterministic risk indicator.
 *
 * The arc represents the rules score out of 100. The label always states that
 * this is an indicator, not a probability of fraud.
 */

// Colours come from the theme tokens so the gauge stays legible in light mode.
const GAUGE_COLORS = {
  'HIGH RISK': {
    stroke: 'var(--a-danger)',
    soft: 'color-mix(in srgb, var(--a-danger) 30%, transparent)',
    text: 'text-danger'
  },
  SUSPICIOUS: {
    stroke: 'var(--a-amber)',
    soft: 'color-mix(in srgb, var(--a-amber) 30%, transparent)',
    text: 'text-amber-400'
  },
  'LOW RISK': {
    stroke: 'var(--a-safe)',
    soft: 'color-mix(in srgb, var(--a-safe) 30%, transparent)',
    text: 'text-safe'
  }
};

const SIZE = 190;
const RADIUS = 74;
const STROKE = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RiskGauge({ score = 0, verdict = 'LOW RISK', reducedMotion: reducedMotionProp }) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? prefersReduced;
  const [display, setDisplay] = useState(reducedMotion ? score : 0);

  const colors = GAUGE_COLORS[verdict] || GAUGE_COLORS['LOW RISK'];
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const offset = CIRCUMFERENCE - (display / 100) * CIRCUMFERENCE;

  useEffect(() => {
    if (reducedMotion) {
      setDisplay(clamped);
      return undefined;
    }

    let frame = 0;
    const start = performance.now();
    const duration = 850;

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(clamped * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clamped, reducedMotion]);

  return (
    <div
      className="relative flex h-[190px] w-[190px] items-center justify-center"
      role="img"
      aria-label={`Risk indicator score ${clamped} out of 100. Verdict: ${verdict}.`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS + 9}
          fill="none"
          stroke="var(--graph-edge)"
          strokeWidth="1"
          strokeDasharray="1 7"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--graph-edge)"
          strokeOpacity="0.45"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{
            filter: `drop-shadow(0 0 8px ${colors.soft})`,
            transition: reducedMotion ? 'none' : 'stroke-dashoffset 120ms linear'
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-semibold tabular-nums tracking-tight ${colors.text}`}>
          {display}
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          / 100 indicator
        </span>
        <span className="mt-2 text-[10px] uppercase tracking-[0.16em] text-muted">{verdict}</span>
      </div>
    </div>
  );
}
