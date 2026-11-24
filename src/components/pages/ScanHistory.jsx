import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock3,
  Fingerprint,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X
} from 'lucide-react';

import { PageLayout } from '../PageLayout';

const STORAGE_KEY = 'paksh-scan-history';

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  } catch {
    // Storage unavailable — silently ignore
  }
}

const VERDICT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'HIGH RISK', label: 'High risk' },
  { id: 'SUSPICIOUS', label: 'Suspicious' },
  { id: 'LOW RISK', label: 'Low risk' }
];

function verdictTone(verdict) {
  if (verdict === 'HIGH RISK') return 'text-danger';
  if (verdict === 'SUSPICIOUS') return 'text-amber-400';
  return 'text-safe';
}

export default function ScanHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState(loadHistory);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all');

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const deleteEntry = useCallback((id) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    setConfirmDelete(null);
  }, []);

  const clearAll = useCallback(() => {
    setHistory([]);
    setConfirmClear(false);
  }, []);

  // Reopen a stored investigation in the Report or Graph view.
  const openEntry = useCallback(
    (entry, route) => {
      if (!entry.report) return;
      try {
        sessionStorage.setItem(
          'paksh-last-report',
          JSON.stringify({
            report: entry.report,
            message: entry.message || entry.text || '',
            reputation: entry.reputation || null,
            urlDetails: entry.urlDetails || []
          })
        );
      } catch {
        // Storage unavailable — the target page shows its empty state.
      }
      navigate(route);
    },
    [navigate]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return history.filter((entry) => {
      if (verdictFilter !== 'all' && entry.verdict !== verdictFilter) return false;
      if (!needle) return true;
      return `${entry.title} ${entry.preview} ${entry.text}`.toLowerCase().includes(needle);
    });
  }, [history, query, verdictFilter]);

  if (history.length === 0) {
    return (
      <PageLayout
        title="Scan History"
        subtitle="Your previous local scans appear here. Stored only in your browser — no account, no server."
        breadcrumb="Scan History"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-white/[0.02]">
            <Fingerprint className="h-6 w-6 text-faint" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white">No scan history yet</h2>
          <p className="max-w-xs text-sm text-slate-400">
            Run an investigation from the Scanner and it will appear here locally.
          </p>
          <Link to="/scanner" className="btn-primary mt-6">
            Go to scanner <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Scan History"
      subtitle="Previous investigations stored locally in your browser. You can delete individual entries or clear everything."
      breadcrumb="Scan History"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow-cyan">
          Local history · {history.length} saved
        </p>
        {confirmClear ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Delete all {history.length} entries?</span>
            <button type="button" onClick={clearAll} className="btn-danger text-xs !px-3 !py-2">
              Confirm clear
            </button>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="btn-ghost text-xs !px-3 !py-2"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="btn-danger text-xs !px-3 !py-2"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear all
          </button>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search scan history</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('');
            }}
            placeholder="Search past scans by text"
            className="input-field !py-2 !pl-9 !pr-8 text-xs"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-faint hover:text-white"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </label>

        <div className="seg" role="group" aria-label="Filter by verdict">
          {VERDICT_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className="seg-btn"
              aria-pressed={verdictFilter === filter.id}
              onClick={() => setVerdictFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel flex flex-col items-center px-6 py-14 text-center">
          <Search className="mb-3 h-5 w-5 text-faint" />
          <p className="text-sm font-medium text-white">No scans match this filter</p>
          <p className="mt-1 max-w-xs text-[11px] text-slate-400">
            Try a different verdict or clear the search text.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setVerdictFilter('all');
            }}
            className="btn-ghost mt-4 text-xs !px-3 !py-2"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const isConfirm = confirmDelete === entry.id;
            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-line bg-white/[0.01] p-3 transition-colors hover:border-line-strong"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.02]">
                  {entry.verdict === 'HIGH RISK' ? (
                    <ShieldAlert className="h-4 w-4 text-danger" />
                  ) : entry.verdict === 'SUSPICIOUS' ? (
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-safe" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="truncate text-sm font-semibold text-white">{entry.title}</h3>
                    <span
                      className={`font-mono text-[9px] uppercase tracking-[0.12em] ${verdictTone(entry.verdict)}`}
                    >
                      {entry.verdict}
                    </span>
                  </div>
                  <p className="max-w-[400px] truncate text-[10px] text-faint">{entry.preview}</p>
                  {expanded === entry.id ? (
                    <p className="mt-2 whitespace-pre-line break-words rounded-lg border border-line bg-ink/40 p-2.5 text-[11px] leading-relaxed text-slate-300">
                      {entry.text || entry.preview}
                    </p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[9px] text-faint">
                      {entry.score}/100 · {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                      className="text-xs text-faint transition-colors hover:text-white"
                      aria-expanded={expanded === entry.id}
                    >
                      {expanded === entry.id ? 'Hide' : 'View'}
                    </button>
                    {entry.report ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openEntry(entry, '/report')}
                          className="text-xs text-faint transition-colors hover:text-cyan"
                        >
                          Report
                        </button>
                        <button
                          type="button"
                          onClick={() => openEntry(entry, '/intelligence-graph')}
                          className="text-xs text-faint transition-colors hover:text-cyan"
                        >
                          Graph
                        </button>
                      </>
                    ) : null}
                    {!isConfirm ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(entry.id)}
                        className="text-xs text-faint transition-colors hover:text-danger"
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-xs text-danger transition-colors hover:text-danger/80"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="text-xs text-faint transition-colors hover:text-white"
                        >
                          Cancel
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-line bg-white/[0.02] p-4">
        <p className="label mb-2">Privacy</p>
        <p className="text-xs text-slate-400">
          Scan history is stored only in your browser&apos;s session storage. It is cleared when you close
          the tab. PAKSH does not store message content on any server.
        </p>
      </div>
    </PageLayout>
  );
}
