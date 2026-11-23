import { useState, useCallback } from 'react';
import { analyzeRules } from './lib/rules';
import { mergeReport } from './lib/merge';
import { SAMPLE_CHIPS } from './lib/samples';
import {
  Microscope,
  Send,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function App() {
  const [message, setMessage] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fillSample = useCallback((text) => {
    setMessage(text);
    setError(null);
    setReport(null);
  }, []);

  const runAnalysis = useCallback(async (text) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);

    // Layer 1: Rules (instant)
    const rules = analyzeRules(text);

    // Layer 2 + 3: AI + Merge (graceful fallback if API unreachable)
    let ai = null;
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, rules })
      });
      if (res.ok) {
        ai = await res.json();
      }
    } catch (e) {
      // Silent fallback — API unavailable in local dev without vercel dev
      ai = null;
    }

    const merged = mergeReport(rules, ai);
    setReport(merged);
    setLoading(false);
  }, []);

  const handleInvestigate = () => {
    runAnalysis(message);
  };

  const reset = () => {
    setMessage('');
    setReport(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100 px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Microscope className="w-6 h-6 text-cyan" />
          <h1 className="text-2xl font-bold text-white tracking-tight">TRUSTLENS</h1>
        </div>
        <p className="text-cyan text-sm font-medium">
          Don&apos;t Just Detect Scams. Reveal the Deception.
        </p>
        <p className="text-muted text-sm mt-1">
          Explainable scam, phishing &amp; fake-offer verifier for Indian students.
        </p>
      </div>

      {/* Input Panel */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-navy-card border border-slate-700 rounded-2xl p-6 shadow-glow">
          <div className="mb-4">
            <textarea
              id="message"
              className="w-full bg-navy-dark border border-slate-700 rounded-xl p-4 text-slate-100 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan resize-none min-h-[140px] text-sm leading-relaxed"
              placeholder="Paste SMS, WhatsApp message, job offer, or a URL here…"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(null);
                setReport(null);
              }}
            />
          </div>

          {/* Sample chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs text-muted uppercase tracking-wider mb-2 block">Try a sample</span>
            {SAMPLE_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => fillSample(chip.text)}
                className="px-3 py-1.5 rounded-lg text-xs border border-slate-600 bg-slate-800/50 hover:border-cyan hover:text-cyan transition-colors"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              Messages are not stored. History stays on your device.
            </p>
            <button
              onClick={handleInvestigate}
              disabled={loading || !message.trim()}
              className="px-6 py-3 rounded-xl font-bold bg-cyan text-navy-dark hover:bg-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Scanning…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Investigate
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Raw Report (Phase 1) */}
      {report && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-navy-card border border-slate-700 rounded-2xl p-6 shadow-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Raw Report</h2>
              <button
                onClick={reset}
                className="text-xs text-muted hover:text-white underline"
              >
                New investigation
              </button>
            </div>

            <div className="grid gap-4 mb-6">
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-muted uppercase tracking-wider">Risk Score</div>
                <div className="text-3xl font-bold text-white">
                  {report.riskScore}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-muted uppercase tracking-wider">Confidence</div>
                <div className="text-3xl font-bold text-cyan">
                  {report.confidence}%
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-muted uppercase tracking-wider">Verdict</div>
                <div className={`text-xl font-bold ${
                  report.verdict === 'SCAM' ? 'text-danger' : 'text-safe'
                }`}>
                  {report.verdict}
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="text-xs text-muted uppercase tracking-wider">Source</div>
                <div className="text-sm font-medium text-violet">
                  {report.source === 'ai-merged' ? 'AI + Rules' : 'Rules only'}
                </div>
              </div>
            </div>

            {report.aiReason && (
              <div className="mb-4 p-3 rounded-xl bg-violet/10 border border-violet/20 text-violet-200 text-sm">
                {report.aiReason}
              </div>
            )}

            {report.signals.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Signals Detected</h3>
                <ul className="space-y-2">
                  {report.signals.map((sig) => (
                    <li key={sig.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <div className={`w-2 h-2 rounded-full mt-1 ${
                        sig.severity === 'critical' ? 'bg-danger' :
                        sig.severity === 'high' ? 'bg-orange-500' :
                        sig.severity === 'medium' ? 'bg-violet' : 'bg-safe'
                      }`} />
                      <div>
                        <div className="text-sm font-semibold text-white">{sig.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{sig.evidence}</div>
                        <div className="text-xs text-slate-500 mt-1">+{sig.weight}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-xl bg-safe/10 border border-safe/20 text-safe text-sm">
                No suspicious signals detected. This looks safe.
              </div>
            )}

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Raw JSON</h3>
              <pre className="bg-navy-dark rounded-xl p-4 text-xs overflow-auto text-slate-400 max-h-64">
                {JSON.stringify(report, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}