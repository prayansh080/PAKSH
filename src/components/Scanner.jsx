import { useMemo, useState } from 'react';
import {
  ClipboardPaste,
  Link2,
  Loader2,
  MessageSquareWarning,
  ScanSearch,
  ShieldCheck,
  Trash2,
  Wallet
} from 'lucide-react';

const SAMPLE_ICONS = {
  internship: Wallet,
  kyc: Link2,
  otp: MessageSquareWarning,
  safe: ShieldCheck,
  courier: Link2,
  scholarship: Wallet
};

/**
 * Scanner — the primary input surface.
 *
 * Controlled textarea, paste/clear actions, keyboard shortcut, sample chips,
 * and honest helper text about what runs locally versus server-side.
 */
export function Scanner({
  value,
  onChange,
  onAnalyze,
  onSample,
  loading = false,
  error = '',
  samples = []
}) {
  const [pasteError, setPasteError] = useState('');

  const trimmed = value.trim();
  const charCount = value.length;
  const canAnalyze = trimmed.length > 0 && !loading;

  const helper = useMemo(() => {
    if (charCount === 0) return 'Paste an SMS, WhatsApp message, job offer, or link.';
    if (charCount < 12) return 'Add a little more context for a useful result.';
    if (charCount > 4000) return 'Long message — the full text will still be analysed and preserved.';
    return 'Rules run instantly. Optional AI context and URL reputation stay server-side.';
  }, [charCount]);

  const handlePaste = async () => {
    setPasteError('');
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setPasteError('Clipboard access is not available in this browser.');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
      else setPasteError('Clipboard is empty.');
    } catch {
      setPasteError('Clipboard access was blocked. Paste with Ctrl+V instead.');
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (canAnalyze) onAnalyze();
    }
  };

  return (
    <section id="scan" className="scroll-mt-24">
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="flex items-center gap-2">
            <ScanSearch className="h-4 w-4 text-cyan" />
            <span className="eyebrow text-slate-300">Message scanner</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip">
              <span className="h-1.5 w-1.5 rounded-full bg-safe" />
              Local rules
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-faint sm:inline">
              Ctrl + Enter
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <label htmlFor="message" className="sr-only">
            Message to analyse
          </label>
          <div className="relative rounded-xl border border-line bg-ink/60 transition-colors focus-within:border-cyan/40">
            <textarea
              id="message"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste the message you received — an internship offer, KYC alert, payment request, or link…"
              aria-describedby="message-helper message-error"
              aria-invalid={Boolean(error)}
              spellCheck={false}
              className="min-h-[168px] w-full resize-y bg-transparent px-4 py-4 text-[15px] leading-7 text-slate-100 placeholder:text-faint focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
              <div className="flex items-center gap-2">
                <button type="button" onClick={handlePaste} className="btn-ghost !px-2.5 !py-1.5 text-xs">
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setPasteError('');
                  }}
                  disabled={!value}
                  className="btn-ghost !px-2.5 !py-1.5 text-xs disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                {charCount} chars
              </span>
            </div>
          </div>

          <p id="message-helper" className="mt-2.5 text-[11px] leading-relaxed text-faint">
            {helper}
          </p>

          {pasteError ? (
            <p className="mt-1 text-[11px] text-amber-400">{pasteError}</p>
          ) : null}

          {error ? (
            <p id="message-error" role="alert" className="mt-2 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="order-2 text-[11px] text-faint sm:order-1">
              Nothing is stored. No account required.
            </p>
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!canAnalyze}
              className="btn-primary order-1 w-full sm:order-2 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analysing…
                </>
              ) : (
                <>
                  <ScanSearch className="h-4 w-4" />
                  Investigate message
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-t border-line bg-ink/30 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">Try an example</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
              Realistic test messages
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2 lg:grid-cols-5">
            {samples.map((sample) => {
              const Icon = SAMPLE_ICONS[sample.id] || MessageSquareWarning;
              const safe = sample.tone === 'safe';
              return (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => onSample(sample.text)}
                  className="group flex items-start gap-2 rounded-xl border border-line bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-line-strong hover:bg-white/[0.05]"
                >
                  <Icon
                    className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${safe ? 'text-safe' : 'text-cyan'}`}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-slate-200">
                      {sample.label}
                    </span>
                    <span
                      className={`mt-0.5 block font-mono text-[9px] uppercase tracking-[0.14em] ${
                        safe ? 'text-safe/80' : 'text-faint'
                      }`}
                    >
                      {safe ? 'Safe example' : 'Scam example'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
