import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Download,
  Globe2,
  Loader2,
  Network,
  ScanSearch,
  ShieldAlert,
  Trash2
} from 'lucide-react';

import { analyzeRules } from '../../lib/rules';
import { mergeReport } from '../../lib/merge';
import { analyzeURL, extractUrls } from '../../lib/urlSignals';
import {
  REPUTATION_STATE,
  checkUrlReputation,
  initialReputation
} from '../../lib/reputation';
import { getActiveStages } from '../../lib/signals';
import { downloadReport } from '../../lib/exportReport';

import { PageLayout } from '../PageLayout';
import { ScanProgress } from '../ScanProgress';
import { ReportLayout } from '../ReportLayout';
import { ErrorBoundary } from '../ErrorBoundary';

const MIN_SCAN_MS = 1100;
const AI_TIMEOUT_MS = 7000;
const HISTORY_KEY = 'paksh-scan-history';
const LAST_REPORT_KEY = 'paksh-last-report';

/**
 * Read a one-shot handoff value (Threat Lab sample / URL page).
 * Reading never clears the key: StrictMode renders twice, so clearing here
 * would empty the value that the surviving render sees. The mount effect below
 * clears it once the state is committed.
 */
function readHandoff(key) {
  try {
    return sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

/** Persist a scan to local session history (read by the Scan History page). */
function saveHistoryEntry(entry) {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...list].slice(0, 50)));
  } catch {
    // Storage unavailable — history is best-effort only.
  }
}

/** Persist the newest report so the full Report route can render it. */
function saveLastReport(payload) {
  try {
    sessionStorage.setItem(LAST_REPORT_KEY, JSON.stringify(payload));
  } catch {
    // Storage unavailable — the Report route falls back to its empty state.
  }
}

const STAGE_DEFS = [
  { id: 'structure', label: 'Inspecting message structure' },
  { id: 'signals', label: 'Detecting suspicious signals' },
  { id: 'risk', label: 'Evaluating risk indicators' },
  { id: 'pattern', label: 'Connecting evidence to scam patterns' },
  { id: 'intel', label: 'Checking link reputation' },
  { id: 'report', label: 'Preparing intelligence report' }
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function buildStages(hasUrls) {
  return STAGE_DEFS.map((stage) => ({
    ...stage,
    status: stage.id === 'intel' && !hasUrls ? 'skipped' : 'pending',
    detail: stage.id === 'intel' && !hasUrls ? 'No links' : ''
  }));
}

/**
 * Scanner — dedicated investigation workspace.
 * Supports message and URL input, analysis modes, sample chips, and a staged scan sequence.
 */
export default function ScannerPage() {
  const navigate = useNavigate();
  const prefersReduced = useReducedMotion();

  // One-shot handoffs (Threat Lab sample, URL Intelligence) — read once, even
  // under StrictMode's double render.
  const handoffRef = useRef(null);
  if (handoffRef.current === null) {
    handoffRef.current = {
      sample: readHandoff('paksh-sample'),
      url: readHandoff('paksh-url')
    };
  }

  const [message, setMessage] = useState(() => handoffRef.current.sample);
  const [url, setUrl] = useState(() => handoffRef.current.url);
  const [mode, setMode] = useState(() => (handoffRef.current.url ? 'url' : 'message'));

  // Consume the handoff keys once the prefilled state is committed.
  useEffect(() => {
    try {
      sessionStorage.removeItem('paksh-sample');
      sessionStorage.removeItem('paksh-url');
    } catch {
      // Storage unavailable — nothing to clear.
    }
  }, []);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stages, setStages] = useState([]);
  const [reputation, setReputation] = useState(() => initialReputation());
  const [urlDetails, setUrlDetails] = useState([]);
  const [statusLine, setStatusLine] = useState('');

  const reportRef = useRef(null);
  const runIdRef = useRef(0);
  const abortRef = useRef(null);

  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  useEffect(() => {
    if (!report || loading) return;
    const node = reportRef.current;
    if (!node) return;
    const frame = requestAnimationFrame(() => {
      node.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      node.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [report, loading, prefersReduced]);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    if (abortRef.current) abortRef.current.abort();
    setMessage('');
    setUrl('');
    setReport(null);
    setLoading(false);
    setError('');
    setStages([]);
    setReputation(initialReputation());
    setUrlDetails([]);
    setStatusLine('');
  }, []);

  const handleAnalyze = useCallback(async () => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const startedAt = Date.now();
    setLoading(true);
    setError('');
    setReport(null);
    setReputation(initialReputation());
    setUrlDetails([]);
    setStatusLine('Analysis started.');

    if (mode === 'url') {
      const u = url.trim();
      if (!u) {
        setError('Enter a URL to investigate.');
        setLoading(false);
        return;
      }
      try {
        new URL(u.startsWith('http') ? u : `https://${u}`);
      } catch {
        setError('Please enter a valid URL (http:// or https://).');
        setLoading(false);
        return;
      }

      const normalized = u.startsWith('http') ? u : `https://${u}`;
      const details = [analyzeURL(normalized)].filter(Boolean);
      const rules = analyzeRules(normalized);
      const hasUrls = details.length > 0;

      setStages(buildStages(hasUrls));

      const aiTimeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
      const aiPromise = fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `URL: ${normalized}`, rules }),
        signal: controller.signal
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);

      const rep = hasUrls ? await checkUrlReputation([normalized]) : { ...initialReputation(), status: REPUTATION_STATE.NOT_NEEDED };

      const mark = (id, status, detail) =>
        setStages((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status, detail: detail ?? s.detail } : s))
        );

      mark('structure', 'active');
      await wait(180);
      mark('structure', 'done', `${normalized.length} chars`);

      mark('signals', 'active');
      await wait(200);
      mark('signals', 'done', `${rules.signals.length} signal${rules.signals.length === 1 ? '' : 's'}`);

      mark('risk', 'active');
      await wait(200);
      mark('risk', 'done', `${rules.score}/100 · ${rules.verdict}`);

      mark('pattern', 'active');
      await wait(180);
      mark('pattern', 'done', `${getActiveStages(rules.signals).length} of 6 stages`);

      if (hasUrls) mark('intel', 'active');

      const [ai, repRes] = await Promise.all([aiPromise, rep]);
      clearTimeout(aiTimeout);

      if (runId !== runIdRef.current) return;

      if (hasUrls) {
        const detail =
          repRes.status === REPUTATION_STATE.OK
            ? repRes.matches.length > 0
              ? `${repRes.matches.length} match${repRes.matches.length === 1 ? '' : 'es'}`
              : 'No matches'
            : repRes.status === REPUTATION_STATE.NOT_CONFIGURED
              ? 'Not configured'
              : 'Unavailable';
        mark('intel', 'done', detail);
      }

      mark('report', 'active');

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SCAN_MS) await wait(MIN_SCAN_MS - elapsed);
      if (runId !== runIdRef.current) return;

      const merged = mergeReport(rules, ai || { available: false, reason: 'unreachable' }, `URL: ${normalized}`);
      saveHistoryEntry({
        id: `${Date.now()}`,
        title: normalized,
        preview: normalized,
        text: `URL: ${normalized}`,
        message: `URL: ${normalized}`,
        verdict: merged.verdict,
        score: merged.riskScore,
        timestamp: Date.now(),
        report: merged
      });
      saveLastReport({
        report: merged,
        message: `URL: ${normalized}`,
        reputation: repRes,
        urlDetails: details
      });
      setReport(merged);
      setReputation(repRes);
      setUrlDetails(details);
      mark('report', 'done', 'Ready');
      setLoading(false);
      return;
    }

    // Message mode
    const text = message.trim();
    if (!text) {
      setError('Paste a message before starting the analysis.');
      setLoading(false);
      return;
    }

    const rules = analyzeRules(text);
    const urls = extractUrls(text).slice(0, 5);
    const details = urls.map((u) => analyzeURL(u)).filter(Boolean);
    const hasUrls = urls.length > 0;

    setStages(buildStages(hasUrls));

    const aiTimeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
    const aiPromise = fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, rules }),
      signal: controller.signal
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const rep = hasUrls ? await checkUrlReputation(urls) : Promise.resolve({ ...initialReputation(), status: REPUTATION_STATE.NOT_NEEDED });

    const mark = (id, status, detail) =>
      setStages((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status, detail: detail ?? s.detail } : s))
      );

    mark('structure', 'active');
    await wait(180);
    mark('structure', 'done', `${text.length} chars`);

    mark('signals', 'active');
    await wait(200);
    mark('signals', 'done', `${rules.signals.length} signal${rules.signals.length === 1 ? '' : 's'}`);

    mark('risk', 'active');
    await wait(200);
    mark('risk', 'done', `${rules.score}/100 · ${rules.verdict}`);

    mark('pattern', 'active');
    await wait(180);
    mark('pattern', 'done', `${getActiveStages(rules.signals).length} of 6 stages`);

    if (hasUrls) mark('intel', 'active');

    const [ai, repRes] = await Promise.all([aiPromise, rep]);
    clearTimeout(aiTimeout);

    if (runId !== runIdRef.current) return;

    if (hasUrls) {
      const detail =
        repRes.status === REPUTATION_STATE.OK
          ? repRes.matches.length > 0
            ? `${repRes.matches.length} match${repRes.matches.length === 1 ? '' : 'es'}`
            : 'No matches'
          : repRes.status === REPUTATION_STATE.NOT_CONFIGURED
            ? 'Not configured'
            : 'Unavailable';
      mark('intel', 'done', detail);
    }

    mark('report', 'active');

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_SCAN_MS) await wait(MIN_SCAN_MS - elapsed);
    if (runId !== runIdRef.current) return;

    const merged = mergeReport(rules, ai || { available: false, reason: 'unreachable' }, text);
    saveHistoryEntry({
      id: `${Date.now()}`,
      title: text.slice(0, 60),
      preview: text.slice(0, 160),
      text,
      message: text,
      verdict: merged.verdict,
      score: merged.riskScore,
      timestamp: Date.now(),
      report: merged
    });
    saveLastReport({
      report: merged,
      message: text,
      reputation: repRes,
      urlDetails: details
    });
    setReport(merged);
    setReputation(repRes);
    setUrlDetails(details);
    mark('report', 'done', 'Ready');
    setLoading(false);
  }, [mode, message, url]);

  const handleSample = useCallback((text) => {
    setMessage(text);
    setUrl('');
    setError('');
    setReport(null);
    setStatusLine('');
    setMode('message');
  }, []);

  return (
    <PageLayout
      title="Intelligence Scanner"
      subtitle="Analyze a suspicious message or URL. The deterministic rules engine runs in your browser."
      breadcrumb="Scanner"
    >
      <div className="space-y-6">
        {/* Investigation console */}
        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan">
                <ScanSearch className="h-4 w-4" />
              </span>
              <div>
                <p className="eyebrow-cyan">Investigation console</p>
                <h2 className="mt-0.5 text-base font-semibold text-white">Analyze input</h2>
              </div>
            </div>
            <div className="inline-flex w-full rounded-xl border border-line bg-ink/60 p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setMode('message');
                  setError('');
                }}
                className={`flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-medium transition-colors sm:flex-none ${
                  mode === 'message'
                    ? 'bg-cyan/10 text-cyan border border-cyan/25'
                    : 'text-slate-400 hover:text-white hover:border-white/10 border border-white/10'
                }`}
              >
                Message
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('url');
                  setError('');
                }}
                className={`flex-1 rounded-lg px-3 py-1.5 text-center text-xs font-medium transition-colors sm:flex-none ${
                  mode === 'url'
                    ? 'bg-cyan/10 text-cyan border border-cyan/25'
                    : 'text-slate-400 hover:text-white hover:border-white/10 border border-white/10'
                }`}
              >
                URL
              </button>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="px-5 py-5 sm:px-6">
            {mode === 'message' ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="message-input" className="label">
                    Message to analyze
                  </label>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint tabular-nums">
                    {message.length} characters
                  </span>
                </div>
                <textarea
                  id="message-input"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Paste an SMS, WhatsApp message, email, job offer, or link…"
                  rows={10}
                  spellCheck={false}
                  aria-invalid={Boolean(error)}
                  aria-describedby="scanner-help scanner-error"
                  className="input-field resize-y leading-7"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="url-input" className="label block">
                  URL to investigate
                </label>
                <div className="relative">
                  <Globe2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
                  <input
                    id="url-input"
                    type="text"
                    inputMode="url"
                    autoComplete="off"
                    spellCheck={false}
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="https://example.com/suspicious-link"
                    aria-invalid={Boolean(error)}
                    aria-describedby="scanner-help scanner-error"
                    className="input-field pl-10"
                  />
                </div>
                <p className="text-xs text-faint">
                  Local URL structure is checked immediately. External reputation requires server configuration.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setMessage('');
                  setUrl('');
                  setError('');
                  setReport(null);
                  setStages([]);
                  setReputation(initialReputation());
                  setUrlDetails([]);
                  setStatusLine('');
                }}
                disabled={!message && !url}
                className="btn-ghost text-xs !px-3 !py-2"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
              <span className="hidden items-center gap-1.5 text-[11px] text-faint sm:inline-flex">
                <LockIcon className="h-3 w-3" /> Runs locally
              </span>
              <button
                type="submit"
                disabled={loading || (mode === 'message' ? !message.trim() : !url.trim())}
                className="btn-primary w-full sm:w-auto sm:min-w-[220px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <ScanSearch className="h-4 w-4" />
                    Run investigation
                  </>
                )}
              </button>
            </div>

            <p id="scanner-help" className="mt-3 text-[11px] leading-relaxed text-faint">
              Analysis runs locally. Optional AI and reputation features contact the server only when configured.
            </p>
          </form>

          {error && (
            <div
              id="scanner-error"
              role="alert"
              className="mx-5 mb-5 flex items-center gap-2 rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-sm text-danger sm:mx-6"
            >
              <ShieldAlert className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* No fictional data on the main product surface */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-ink/30 px-5 py-4 sm:px-6">
            <p className="max-w-md text-[11px] leading-relaxed text-faint">
              Analysis runs in your browser. Nothing is stored on a server unless optional AI or URL
              reputation is configured.
            </p>
            <Link to="/threat-lab" className="btn-ghost text-xs !px-3 !py-2">
              Labelled examples in Threat Lab
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

        {/* Scan progress + report */}
        <section className="space-y-4">
          {loading && stages.length > 0 ? (
            <ScanProgress stages={stages} reducedMotion={prefersReduced} />
          ) : null}

          <p className="sr-only" role="status" aria-live="polite">
            {statusLine}
          </p>

          {report ? (
            <section
              id="report"
              ref={reportRef}
              tabIndex={-1}
              aria-label="Intelligence report"
              className="scroll-mt-24 pt-2 outline-none"
            >
              <ErrorBoundary onReset={reset}>
                <ReportLayout
                  report={report}
                  message={mode === 'message' ? message : `URL: ${url}`}
                  reducedMotion={prefersReduced}
                  reputation={reputation}
                  urlDetails={urlDetails}
                />
              </ErrorBoundary>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" onClick={reset} className="btn-ghost text-xs !px-3 !py-2">
                  New investigation
                </button>
                <Link to="/intelligence-graph" className="btn-ghost text-xs !px-3 !py-2">
                  <Network className="h-3.5 w-3.5" />
                  View evidence graph
                </Link>
                <Link to="/report" className="btn-ghost text-xs !px-3 !py-2">
                  Full report
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <button
                  type="button"
                  onClick={() => downloadReport(report, mode === 'message' ? message : `URL: ${url}`)}
                  className="btn-ghost text-xs !px-3 !py-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download report
                </button>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </PageLayout>
  );
}

function LockIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
