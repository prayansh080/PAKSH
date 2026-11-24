import { motion, useReducedMotion } from 'framer-motion';

/**
 * RiskMeter — animated count-up visualization of the risk score.
 * 
 * Displays the deterministic risk indicator score with a clean count-up animation.
 * Shows the verdict-based color and the mandatory transparency label.
 * 
 * Supports three verdict tiers:
 *   'HIGH RISK'   >= 30  (red)
 *   'SUSPICIOUS'  >= 20  (amber/violet)
 *   'LOW RISK'    < 20   (green)
 */

export function RiskMeter({ score, verdict }) {
  const reducedMotion = useReducedMotion();

  // Color mapping by verdict (matching existing design system)
  // Quoted keys because esbuild does not allow unquoted object keys with spaces
  const verdictStyles = {
    'HIGH RISK': { bg: 'bg-danger/10', border: 'border-danger/20', text: 'text-danger' },
    'SUSPICIOUS': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    'LOW RISK': { bg: 'bg-safe/10', border: 'border-safe/20', text: 'text-safe' },
  };

  const style = verdictStyles[verdict] || verdictStyles['LOW RISK'];

  if (reducedMotion) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs uppercase tracking-wider opacity-70">
          Risk indicator score — not a probability of fraud
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={`
        rounded-2xl p-4 flex items-center gap-3
        ${style.bg} ${style.border} ${style.text}
        transition-all duration-500
      `}
      animate={{
        scale: [0.8, 1],
        transition: { type: "spring", stiffness: 120, damping: 20 }
      }}
    >
      <span className="text-3xl font-bold text-navy-dark">{score}</span>
      <span className="text-xs uppercase tracking-wider opacity-70">
        Risk indicator score — not a probability of fraud
      </span>
    </motion.div>
  );
}