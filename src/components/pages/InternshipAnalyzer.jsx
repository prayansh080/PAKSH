import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Loader2, RotateCcw, ShieldAlert, ShieldCheck, Wallet } from 'lucide-react';

import { PageLayout } from '../PageLayout';
import { analyzeRules } from '../../lib/rules';
import { mergeReport } from '../../lib/merge';

const HISTORY_KEY = 'paksh-scan-history';
const LAST_REPORT_KEY = 'paksh-last-report';

const RING_CIRCUMFERENCE = 2 * Math.PI * 27;

/** Ring colour per verdict — matches the verdict chip above it. */
function verdictRing(verdict) {
  if (verdict === 'HIGH RISK') return { stroke: 'var(--a-danger)', glow: 'var(--a-danger)' };
  if (verdict === 'SUSPICIOUS') return { stroke: 'var(--a-amber)', glow: 'var(--a-amber)' };
  return { stroke: 'var(--a-safe)', glow: 'var(--a-safe)' };
}

/** Persist the offer analysis so Report, Graph and History can open it. */
function persistReport(report, message) {
  try {
    sessionStorage.setItem(
      LAST_REPORT_KEY,
      JSON.stringify({ report, message, reputation: null, urlDetails: [] })
    );
  } catch {
    // Storage unavailable — Report/Graph fall back to their empty state.
  }
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    const entry = {
      id: `${Date.now()}`,
      title: 'Internship offer analysis',
      preview: message.slice(0, 160),
      text: message,
      message,
      verdict: report.verdict,
      score: report.riskScore,
      timestamp: Date.now(),
      report
    };
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...list].slice(0, 50)));
  } catch {
    // Storage unavailable — history is best-effort only.
  }
}

const FIELDS = [
  {
    id: 'company',
    label: 'Company or organization name',
    placeholder: 'e.g. Infosys, TCS, startup name',
    hint: 'Copy the name exactly as the sender wrote it.'
  },
  {
    id: 'position',
    label: 'Job or internship position',
    placeholder: 'e.g. Software Intern, Marketing Associate'
  },
  {
    id: 'stipend',
    label: 'Stipend or salary offered',
    placeholder: 'e.g. ₹25,000/month'
  },
  {
    id: 'fee',
    label: 'Any fee requested (registration, training, deposit)',
    placeholder: 'e.g. ₹1,499 registration fee',
    hint: 'Any amount asked for before joining is a strong signal.'
  },
  {
    id: 'platform',
    label: 'Communication platform',
    placeholder: 'e.g. Telegram, WhatsApp, email'
  },
  {
    id: 'message',
    label: 'Full offer message or link',
    placeholder: 'Paste the complete offer text or link here',
    rows: 4,
    hint: 'Paste the whole message — the analyzer reads the combined text.'
  }
];

const EMPTY_FORM = Object.fromEntries(FIELDS.map((field) => [field.id, '']));

export default function InternshipAnalyzer() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const filledCount = useMemo(
    () => FIELDS.filter((field) => form[field.id].trim().length > 0).length,
    [form]
  );

  const updateField = (id, value) => {
    setForm((previous) => ({ ...previous, [id]: value }));
    if (error) setError('');
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setError('');
    setResult(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const text = [form.company, form.position, form.stipend, form.fee, form.platform, form.message]
      .map((value) => value.trim())
      .filter(Boolean)
      .join('\n');

    if (!text) {
      setError('Add at least the offer message or the company name before analysing.');
      setResult(null);
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    // Deterministic rules only — the same engine the scanner uses.
    const rules = analyzeRules(text);
    const merged = mergeReport(rules, null, text);

    setResult({
      company: form.company.trim(),
      position: form.position.trim(),
      score: merged.riskScore,
      verdict: merged.verdict,
      signals: merged.signals,
      text
    });

    persistReport(merged, text);
    setLoading(false);
  };

  return (
    <PageLayout
      title="Internship & Job Offer Analyzer"
      subtitle="Specialized investigation for student job and internship offers. Detects upfront fees, off-platform recruiters, and urgency tactics."
      breadcrumb="Internship Analyzer"
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} noValidate className="panel space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="label">Offer details</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint tabular-nums">
              {filledCount}/{FIELDS.length} fields filled
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((field) => {
              const describedBy = `${field.id}-hint`;
              return (
                <div
                  key={field.id}
                  className={field.rows ? 'sm:col-span-2' : 'col-span-1'}
                >
                  <label
                    htmlFor={field.id}
                    className="mb-1 block font-mono text-xs uppercase tracking-[0.14em] text-faint"
                  >
                    {field.label}
                  </label>
                  {field.rows ? (
                    <textarea
                      id={field.id}
                      value={form[field.id]}
                      onChange={(event) => updateField(field.id, event.target.value)}
                      placeholder={field.placeholder}
                      rows={field.rows}
                      aria-describedby={describedBy}
                      className="input-field min-h-[112px] resize-y"
                    />
                  ) : (
                    <input
                      id={field.id}
                      type="text"
                      value={form[field.id]}
                      onChange={(event) => updateField(field.id, event.target.value)}
                      placeholder={field.placeholder}
                      aria-describedby={describedBy}
                      className="input-field"
                    />
                  )}
                  <p id={describedBy} className="mt-1 text-[10px] leading-relaxed text-faint">
                    {field.hint || 'Optional — leave blank if you do not know.'}
                  </p>
                </div>
              );
            })}
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-relaxed text-faint">
              Fill in as much as you know. The analyzer checks the combined text for scam patterns.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={resetForm}
                disabled={filledCount === 0 && !result}
                className="btn-ghost w-full text-xs sm:w-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear form
              </button>
              <button type="submit" disabled={loading} className="btn-primary w-full sm:w-auto">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing offer…
                  </>
                ) : (
                  'Analyze internship offer'
                )}
              </button>
            </div>
          </div>
        </form>

        {result && (
          <section className="panel animate-[fade-up_0.45s_ease-out] p-5 sm:p-6" aria-live="polite">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="label">Investigation result</p>
                <h2 className="mt-0.5 truncate text-sm font-semibold text-white">
                  {result.company || 'Offer analysis'}
                </h2>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                  result.verdict === 'HIGH RISK'
                    ? 'border-danger/25 bg-danger/[0.06] text-danger'
                    : result.verdict === 'SUSPICIOUS'
                      ? 'border-amber/25 bg-amber/[0.06] text-amber'
                      : 'border-safe/25 bg-safe/[0.06] text-safe'
                }`}
              >
                {result.verdict}
              </span>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  className="absolute inset-0 h-16 w-16 -rotate-90"
                  aria-hidden="true"
                >
                  <circle cx="32" cy="32" r="27" fill="none" stroke="var(--graph-edge)" strokeOpacity="0.45" strokeWidth="4" />
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke={verdictRing(result.verdict).stroke}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={
                      RING_CIRCUMFERENCE -
                      (Math.max(0, Math.min(100, Number(result.score) || 0)) / 100) * RING_CIRCUMFERENCE
                    }
                    style={{
                      filter: `drop-shadow(0 0 6px ${verdictRing(result.verdict).glow})`,
                      transition: 'stroke-dashoffset 700ms cubic-bezier(0.22, 1, 0.36, 1)'
                    }}
                  />
                </svg>
                <span className="relative text-lg font-bold tabular-nums">{result.score}</span>
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                  Risk indicator / 100
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                  Fixed rule weights only — AI never changes this number.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="label">Detected signals</p>
              {result.signals.length === 0 ? (
                <p className="text-xs text-faint">
                  {result.text
                    ? 'No scam signals detected in this offer.'
                    : 'No offer details were provided — add the offer text to analyse it.'}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {result.signals.map((signal) => (
                    <li
                      key={signal.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white/[0.02] px-2.5 py-1.5"
                    >
                      <span className="flex min-w-0 items-center gap-1.5 text-xs text-slate-300">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                        <span className="truncate">{signal.label}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[9px] text-amber-400">
                        +{signal.weight}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-line bg-white/[0.02] p-3">
              <p className="label mb-2">Student safety checklist</p>
              <ul className="space-y-1 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3 shrink-0 text-safe" />
                  Never pay registration, training, or processing fees to secure a job.
                </li>
                <li className="flex items-center gap-2">
                  <ShieldAlert className="h-3 w-3 shrink-0 text-amber-400" />
                  Verify the company on its official careers page — not via links in the offer.
                </li>
                <li className="flex items-center gap-2">
                  <Wallet className="h-3 w-3 shrink-0 text-violet" />
                  Do not send money to personal UPI IDs or bank accounts.
                </li>
                <li className="flex items-center gap-2">
                  <Briefcase className="h-3 w-3 shrink-0 text-cyan" />
                  Be wary of recruiters who insist on Telegram or WhatsApp-only communication.
                </li>
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/report" className="btn-ghost text-xs !px-3 !py-2">
                Full report
              </Link>
              <Link to="/intelligence-graph" className="btn-ghost text-xs !px-3 !py-2">
                Evidence graph
              </Link>
              <Link to="/scanner" className="btn-ghost text-xs !px-3 !py-2">
                Analyze another <ArrowRight className="h-3 w-3" />
              </Link>
              <button type="button" onClick={resetForm} className="btn-ghost text-xs !px-3 !py-2">
                New analysis
              </button>
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
