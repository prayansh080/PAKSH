import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Globe2, Loader2, Lock, RotateCcw, ShieldAlert } from 'lucide-react';

import { PageLayout } from '../PageLayout';
import { analyzeURL } from '../../lib/urlSignals';

/**
 * URL Intelligence — transparent local URL investigation.
 *
 * Shows URL structure analysis and honest external reputation status.
 * Never claims a URL is safe based only on local rules.
 */

function normalizeUrl(raw) {
  const value = raw.trim();
  if (!value) return { error: 'Enter a URL to investigate.' };
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { error: 'Only http:// and https:// URLs can be analysed.' };
    }
    if (!parsed.hostname.includes('.') && parsed.hostname !== 'localhost') {
      return { error: 'That does not look like a complete domain (for example example.com).' };
    }
    return { url: candidate };
  } catch {
    return { error: 'Please enter a valid URL (for example https://example.com/page).' };
  }
}

export default function URLIntelligence() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalized = normalizeUrl(input);
    if (normalized.error) {
      setError(normalized.error);
      setAnalysis(null);
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const detail = analyzeURL(normalized.url);
      if (!detail) {
        setError('Could not analyze this URL.');
      } else {
        setAnalysis({ url: normalized.url, detail });
      }
    } catch {
      setError('Could not analyze this URL.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setInput('');
    setAnalysis(null);
    setError('');
  };

  return (
    <PageLayout
      title="URL Intelligence"
      subtitle="Analyze the structure of a suspicious URL. Local checks are always shown; external reputation is reported honestly when configured."
      breadcrumb="URL Intelligence"
    >
      <div className="space-y-6">
        <form onSubmit={handleSubmit} noValidate className="panel p-5 sm:p-6">
          <label htmlFor="url-intel-input" className="label mb-2 block">
            URL to investigate
          </label>
          <div className="relative">
            <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              id="url-intel-input"
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                if (error) setError('');
              }}
              placeholder="https://example.com/page"
              aria-invalid={Boolean(error)}
              aria-describedby="url-intel-help url-intel-error"
              className="input-field pl-10"
            />
          </div>
          <p id="url-intel-help" className="mt-2 text-xs leading-relaxed text-faint">
            Local structure checks only. Nothing is sent to an external service from this page.
          </p>

          {error ? (
            <p
              id="url-intel-error"
              role="alert"
              className="mt-3 flex items-center gap-2 rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-xs text-danger"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary w-full sm:w-auto sm:min-w-[220px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                'Analyze URL structure'
              )}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={!input && !analysis}
              className="btn-ghost text-xs sm:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        </form>

        {analysis && (
          <section className="panel animate-[fade-up_0.4s_ease-out] p-5 sm:p-6" aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="label">URL structure analysis</p>
                <h2 className="mt-0.5 truncate text-sm font-semibold text-white">
                  {analysis.detail.domain}
                </h2>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                  analysis.detail.riskLevel === 'high'
                    ? 'border-danger/25 bg-danger/[0.06] text-danger'
                    : analysis.detail.riskLevel === 'medium'
                      ? 'border-amber/25 bg-amber/[0.06] text-amber'
                      : 'border-safe/25 bg-safe/[0.06] text-safe'
                }`}
              >
                Local risk: {analysis.detail.riskLevel}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <p className="label mb-2">URL</p>
                <p className="break-all font-mono text-xs text-slate-300">{analysis.url}</p>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <p className="label mb-2">Protocol</p>
                <p className="font-mono text-xs text-slate-300">
                  {analysis.detail.https ? 'HTTPS (secure)' : 'HTTP (not secure)'}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <p className="label mb-2">Domain</p>
                <p className="truncate font-mono text-xs text-slate-300">{analysis.detail.domain}</p>
              </div>
              <div className="rounded-lg border border-line bg-white/[0.02] p-3">
                <p className="label mb-2">Official suffix</p>
                <p className="font-mono text-xs text-slate-300">
                  {analysis.detail.isOfficial ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="label mb-2">Local flags</p>
              <div className="flex flex-wrap gap-2">
                {analysis.detail.flags.length > 0 ? (
                  analysis.detail.flags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded border border-line bg-white/[0.02] px-2 py-0.5 font-mono text-[9px] text-slate-300"
                    >
                      {flag}
                    </span>
                  ))
                ) : (
                  <span className="rounded border border-safe/20 bg-safe/[0.03] px-2 py-0.5 font-mono text-[9px] text-safe">
                    No local URL flags
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-line bg-white/[0.02] p-4">
              <p className="label mb-2">Honest interpretation</p>
              <p className="text-xs leading-relaxed text-slate-400">
                Local analysis checks URL structure only — HTTPS, shorteners, lookalike characters,
                raw IP addresses, brand-like domains, and official suffixes.{' '}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                A clean local result does <strong>not</strong> mean a URL is safe. It only means no
                suspicious structural pattern was detected. External reputation (Google Safe Browsing)
                is checked separately by the scanner and is shown honestly as configured or unavailable.
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Lock className="h-3 w-3 shrink-0 text-faint" />
              <span className="text-xs text-faint">
                URL analysis is local. No URL is sent to an external service from this page.
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem('paksh-url', analysis.url);
                  } catch {
                    // Storage unavailable — the scanner opens without prefill.
                  }
                  navigate('/scanner');
                }}
                className="btn-primary text-xs !px-3 !py-2"
              >
                Run a full investigation on this URL
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <Link to="/scanner" className="btn-ghost text-xs !px-3 !py-2">
                Open the scanner
              </Link>
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
