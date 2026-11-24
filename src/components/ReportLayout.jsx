import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BrainCircuit,
  Check,
  ClipboardCopy,
  Clock3,
  Fingerprint,
  Info,
  Layers,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import { VerdictReveal } from './VerdictReveal';
import { HighlightedMessage } from './HighlightedMessage';
import { ScamDNA } from './ScamDNA';
import { ScamAutopsy } from './ScamAutopsy';
import { SafetyActions } from './SafetyActions';
import { ThreatIntel } from './ThreatIntel';
import { ACCENTS, getSignalMeta } from '../lib/signals';

/**
 * ReportLayout — the intelligence report.
 *
 * Reading order answers the six product questions:
 *   what was detected -> where is the evidence -> why it matters ->
 *   what pattern it resembles -> what to do next -> how reliable is this.
 *
 * The risk score shown here is the deterministic rules score. AI context and
 * external reputation are displayed separately and never alter it.
 */

const SEVERITY_LABEL = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  safe: 'None'
};

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ReportLayout({
  report,
  message,
  reducedMotion: reducedMotionProp,
  reputation,
  urlDetails
}) {
  const prefersReduced = useReducedMotion();
  const reducedMotion = reducedMotionProp ?? prefersReduced;
  const [copied, setCopied] = useState(false);

  const signals = useMemo(
    () => (Array.isArray(report?.signals) ? report.signals.filter(Boolean) : []),
    [report]
  );

  const messageText = message || report?.originalMessage || '';
  const urls = useMemo(() => {
    if (Array.isArray(urlDetails) && urlDetails.length > 0) return urlDetails.map((d) => d.url);
    return [];
  }, [urlDetails]);

  const resolvedUrlDetails = useMemo(() => {
    if (Array.isArray(urlDetails) && urlDetails.length > 0) return urlDetails;
    return [];
  }, [urlDetails]);

  const riskScore = report?.riskScore ?? 0;
  const verdict = report?.verdict ?? 'LOW RISK';
  const source = report?.source ?? 'rules';
  const riskLabel = report?.riskLabel ?? 'Risk indicator score — not a probability of fraud.';
  const confidence = report?.confidence ?? 0;
  const analyzedAt = formatTime(report?.analyzedAt);
  const aiAvailable = Boolean(report?.aiAvailable);

  if (!report) return null;

  const handleCopy = async () => {
    const lines = [
      `PAKSH intelligence report`,
      `Verdict: ${verdict} (indicator ${riskScore}/100)`,
      `Signals: ${signals.length > 0 ? signals.map((s) => getSignalMeta(s.id).label).join('; ') : 'none detected'}`,
      `Source: ${source}`,
      analyzedAt ? `Analysed: ${analyzedAt}` : '',
      '',
      'Message:',
      messageText
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <motion.div
      className="space-y-5"
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
    >
      {/* Report header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan">
            <Fingerprint className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">Intelligence report</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              {analyzedAt || 'Generated just now'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VerdictReveal verdict={verdict} compact />
          <button type="button" onClick={handleCopy} className="icon-btn" aria-label="Copy report summary">
            {copied ? <Check className="h-4 w-4 text-safe" /> : <ClipboardCopy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Verdict + evidence */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="panel p-5">
          <div className="flex flex-col items-center">
            <RiskGauge score={riskScore} verdict={verdict} reducedMotion={reducedMotion} />
          </div>

          <div className="mt-4">
            <VerdictReveal verdict={verdict} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-line bg-white/[0.02] px-2.5 py-2">
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Signals</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-100">{signals.length}</dd>
            </div>
            <div className="rounded-lg border border-line bg-white/[0.02] px-2.5 py-2">
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Rule confidence</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-100">{confidence}%</dd>
            </div>
          </dl>

          <p className="mt-3 text-[10px] leading-relaxed text-faint">{riskLabel}</p>
        </div>

        <div className="panel p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Evidence</span>
                Original message
              </h3>
              <p className="mt-1 text-[11px] leading-relaxed text-faint">
                The full message is preserved. Highlighted spans are exact text that triggered a rule.
              </p>
            </div>
            <span className="chip">{messageText.length} chars</span>
          </div>
          <HighlightedMessage message={messageText} signals={signals} />

          <div className="mt-4 border-t border-line pt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="label">Score composition</p>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                {verdict === 'HIGH RISK'
                  ? 'High risk at 30+'
                  : verdict === 'SUSPICIOUS'
                    ? 'Suspicious at 20+'
                    : 'Low risk below 20'}
              </span>
            </div>

            {signals.length > 0 ? (
              <>
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  {signals.map((signal) => {
                    const meta = getSignalMeta(signal.id);
                    const accent = ACCENTS[meta.accent] || ACCENTS.violet;
                    return (
                      <span
                        key={signal.id}
                        className={`h-full ${accent.dot}`}
                        style={{ width: `${meta.weight}%` }}
                        title={`${meta.short} +${meta.weight}`}
                      />
                    );
                  })}
                </div>
                <ul className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                  {signals.map((signal) => {
                    const meta = getSignalMeta(signal.id);
                    const accent = ACCENTS[meta.accent] || ACCENTS.violet;
                    return (
                      <li key={signal.id} className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="flex min-w-0 items-center gap-1.5 text-slate-400">
                          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${accent.dot}`} />
                          <span className="truncate">{meta.short}</span>
                        </span>
                        <span className={`flex-shrink-0 font-mono ${accent.text}`}>+{meta.weight}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <p className="mt-2 text-[11px] text-slate-400">No weighted signals. Indicator score is 0.</p>
            )}

            <p className="mt-2 text-[10px] leading-relaxed text-faint">
              Total {riskScore}/100 from fixed weights. AI cannot add, remove, or reweight a signal.
            </p>
          </div>
        </div>
      </div>

      {/* Signals */}
      <section className="panel p-5" aria-labelledby="signals-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="signals-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Signals</span>
              What was detected
            </h3>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-faint">
              Each signal contributes a fixed weight to the deterministic score. Weights are never
              adjusted by AI.
            </p>
          </div>
          <span className="chip">
            <Layers className="h-3 w-3" />
            {signals.length} detected
          </span>
        </div>

        {signals.length === 0 ? (
          <div className="mt-4 rounded-xl border border-line bg-white/[0.02] p-4">
            <p className="text-sm text-slate-300">No rule signals fired for this message.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              Absence of signals is not proof of safety. PAKSH cannot verify the sender&apos;s identity.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {signals.map((signal, index) => {
              const meta = getSignalMeta(signal.id);
              const accent = ACCENTS[meta.accent] || ACCENTS.violet;
              return (
                <motion.li
                  key={signal.id}
                  className={`rounded-xl border p-3.5 ${accent.border} ${accent.soft}`}
                  initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25, delay: reducedMotion ? 0 : index * 0.04 }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
                      <p className="text-xs font-semibold text-slate-100">{meta.label}</p>
                    </div>
                    <span className={`flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] ${accent.text}`}>
                      +{meta.weight}
                    </span>
                  </div>

                  <p className="mt-2 rounded-lg border border-line/60 bg-ink/40 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-300">
                    {signal.evidence || 'Evidence captured from the message.'}
                  </p>

                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Why it matters · </span>
                    {meta.why}
                  </p>

                  <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-faint">
                    Severity: {SEVERITY_LABEL[meta.severity] || meta.severity}
                  </p>
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>

      {/* AI context, clearly separated */}
      <section className="panel p-5" aria-labelledby="ai-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="ai-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet">Context</span>
              AI explanation
            </h3>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-faint">
              Optional language model context. It can explain, but it cannot change the score or verdict.
            </p>
          </div>
          <span
            className={`rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] ${
              aiAvailable
                ? 'border-violet/25 bg-violet/10 text-violet'
                : 'border-line bg-white/[0.02] text-faint'
            }`}
          >
            {aiAvailable ? 'Available' : 'Not used'}
          </span>
        </div>

        {aiAvailable ? (
          <div className="mt-4 space-y-2">
            {report.aiReport?.summary ? (
              <p className="text-[12px] leading-relaxed text-slate-300">{report.aiReport.summary}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              {report.aiCategory ? <span className="chip">Category: {report.aiCategory}</span> : null}
              {typeof report.aiReport?.confidence === 'number' ? (
                <span className="chip">Model confidence: {report.aiReport.confidence}%</span>
              ) : null}
            </div>
            <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-faint">
              <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0" />
              AI output is advisory context only and is not used to calculate the risk indicator.
            </p>
          </div>
        ) : (
          <p className="mt-4 flex items-start gap-2 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-[11px] leading-relaxed text-slate-400">
            <BrainCircuit className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-faint" />
            {report.aiNote || 'AI context was not used. Rules-only analysis.'}
          </p>
        )}
      </section>

      {/* Pattern map */}
      <section className="panel p-5">
        <ScamDNA signals={signals} reducedMotion={reducedMotion} />
      </section>

      {/* Autopsy + safety */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <ScamAutopsy signals={signals} reducedMotion={reducedMotion} />
        </section>
        <section className="panel p-5">
          <SafetyActions signals={signals} verdict={verdict} />
        </section>
      </div>

      {/* Threat intel */}
      <section className="panel p-5">
        <ThreatIntel urls={urls} urlDetails={resolvedUrlDetails} reputation={reputation} />
      </section>

      {/* Limitations */}
      <section className="panel p-5" aria-labelledby="limitations-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 id="limitations-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">Limits</span>
              How to read this report
            </h3>
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-faint">
              PAKSH is an explainable indicator tool, not a fraud detector with certainty.
            </p>
          </div>
          <span className="chip">
            <Clock3 className="h-3 w-3" />
            Point-in-time analysis
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-white/[0.02] p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
              <ShieldAlert className="h-3.5 w-3.5 text-cyan" />
              Score source
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-faint">
              {source}. Deterministic weights: OTP +30, payment +25, link +20, impersonation +15,
              urgency +10, off-platform +10.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white/[0.02] p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
              <Info className="h-3.5 w-3.5 text-cyan" />
              What is not checked
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-faint">
              Sender identity, message history, domain ownership, and link destinations are not
              verified by the local rules.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white/[0.02] p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
              <Fingerprint className="h-3.5 w-3.5 text-cyan" />
              Privacy
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-faint">
              The message is analysed in your browser by default. It is only sent to the server when
              optional AI or reputation features are enabled.
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
