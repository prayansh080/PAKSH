import { motion, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ACCENTS, getSignalAccent, getSignalMeta } from '../lib/signals';

/**
 * HighlightedMessage — evidence-focused message display.
 *
 * Shows the complete original message, with only exact text segments that
 * triggered detected signals highlighted. The full message is always preserved
 * in its original order; nothing is dropped, reordered, or rewritten.
 *
 * Highlighting is evidence-only: a phrase is highlighted only if that exact
 * substring exists in the original message. Phrases are never fabricated.
 */

// Keywords mirror the rules engine so highlights match the actual evidence.
const SIGNAL_KEYWORDS = {
  'otp-request': [
    'otp', 'one time password', 'one-time password', 'password', 'pin', 'cvv',
    'card number', 'aadhaar', 'pan card', 'verify your account',
    'account verify', 'kyc update', 'otp number', 'transaction password'
  ],
  'upfront-payment': [
    'registration fee', 'processing charge', 'processing fee', 'deposit',
    'refundable fee', 'upfront payment', 'pay today', 'pay now',
    'confirm your position', 'confirm seat', 'booking amount', 'token amount',
    'advance payment', 'pay to confirm', '₹', 'rs.', 'inr', 'transfer',
    'send money', 'gpay', 'phonepe', 'paytm'
  ],
  impersonation: [
    'bank', 'sbi', 'hdfc', 'icici', 'axis', 'rbi', 'courier', 'customs',
    'government', 'govt', 'official', 'department', 'ministry', 'income tax',
    'dtdc', 'fedex', 'bluedart', 'indiapost', 'hr department',
    'recruitment team', 'your bank', 'kyc'
  ],
  urgency: [
    'today only', 'last chance', 'within 24 hours', 'within 24hrs',
    'account will be blocked', 'account blocked', 'suspended', 'expire',
    'expires', 'immediately', 'urgent', 'act now', 'limited time', 'hurry',
    'final notice', 'last date', 'before it expires'
  ],
  'off-platform': [
    'telegram', 'whatsapp only', 'whatsapp-only', 'contact hr', 'hr on',
    'gmail.com', 'outlook.com', 'yahoo.com', 'recruiter', 'hr@gmail',
    'only on telegram', 'msg us', 'message us on', 'whatsapp number',
    'call this number', 'direct message', 'dm us'
  ]
};

const URL_REGEX =
  /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}\/[^\s<>"']*/g;

const SIGNAL_PRIORITY = [
  'otp-request',
  'upfront-payment',
  'suspicious-url',
  'impersonation',
  'urgency',
  'off-platform'
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Case-insensitive matcher that does not match inside longer words
 * ("pin" must not match "shipping"). Currency tokens keep natural boundaries.
 */
function keywordToRegex(keyword) {
  const escaped = escapeRegExp(keyword);
  const needsLeftBoundary = /^[a-zA-Z0-9]/.test(keyword);
  const needsRightBoundary = /[a-zA-Z0-9]$/.test(keyword);
  const left = needsLeftBoundary ? '(^|[^a-zA-Z0-9])' : '()';
  const right = needsRightBoundary ? '(?=[^a-zA-Z0-9]|$)' : '';
  return new RegExp(`${left}(${escaped})${right}`, 'gi');
}

function findRangesForSignal(message, signalId) {
  const ranges = [];

  if (signalId === 'suspicious-url') {
    URL_REGEX.lastIndex = 0;
    let match = URL_REGEX.exec(message);
    while (match !== null) {
      ranges.push([match.index, match.index + match[0].length]);
      if (match.index === URL_REGEX.lastIndex) URL_REGEX.lastIndex += 1;
      match = URL_REGEX.exec(message);
    }
    return ranges;
  }

  const keywords = SIGNAL_KEYWORDS[signalId] || [];
  for (const keyword of keywords) {
    const regex = keywordToRegex(keyword);
    let match = regex.exec(message);
    while (match !== null) {
      const start = match.index + match[1].length;
      const end = start + match[2].length;
      ranges.push([start, end]);
      if (regex.lastIndex <= match.index) regex.lastIndex = match.index + 1;
      match = regex.exec(message);
    }
  }

  return ranges;
}

/**
 * Converts signals into non-overlapping character ranges over the original
 * message. Every character keeps its original position.
 */
function buildHighlightRanges(message, signals) {
  if (!message || signals.length === 0) return [];

  const activeIds = new Set(signals.map((signal) => signal && signal.id));
  const owner = new Array(message.length).fill(null);

  for (const signalId of SIGNAL_PRIORITY) {
    if (!activeIds.has(signalId)) continue;
    for (const [start, end] of findRangesForSignal(message, signalId)) {
      for (let i = start; i < end; i += 1) {
        if (owner[i] === null) owner[i] = signalId;
      }
    }
  }

  const ranges = [];
  let i = 0;
  while (i < message.length) {
    if (owner[i] === null) {
      i += 1;
      continue;
    }
    const signalId = owner[i];
    const start = i;
    while (i < message.length && owner[i] === signalId) i += 1;
    ranges.push({ start, end: i, signalId });
  }

  // Merge same-signal ranges separated only by whitespace so a phrase does not
  // render as several boxed fragments.
  const merged = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.signalId === range.signalId &&
      /^\s*$/.test(message.slice(last.end, range.start))
    ) {
      last.end = range.end;
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
}

function renderMessage(message, ranges) {
  if (ranges.length === 0) return message;

  const nodes = [];
  let cursor = 0;

  ranges.forEach((range, index) => {
    if (range.start > cursor) nodes.push(message.slice(cursor, range.start));

    const text = message.slice(range.start, range.end);
    const accent = getSignalAccent(range.signalId);
    const meta = getSignalMeta(range.signalId);

    nodes.push(
      <span
        key={`highlight-${index}`}
        className={`group relative box-decoration-clone rounded-[3px] px-0.5 underline decoration-1 underline-offset-2 ${accent.bg} ${accent.text}`}
        tabIndex={0}
        aria-label={`Highlighted evidence: ${meta.label}`}
      >
        {text}
        <span
          data-tooltip="true"
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-max max-w-[240px] whitespace-normal rounded-lg border border-line bg-ink px-2.5 py-1.5 text-[10px] font-normal leading-snug text-slate-300 shadow-panel group-hover:block group-focus:block"
        >
          {meta.label}
        </span>
      </span>
    );

    cursor = range.end;
  });

  if (cursor < message.length) nodes.push(message.slice(cursor));
  return nodes;
}

export function HighlightedMessage({ message, signals = [] }) {
  const reducedMotion = useReducedMotion();
  const safeSignals = Array.isArray(signals) ? signals.filter(Boolean) : [];

  if (!message) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-line bg-ink/50 py-10 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-xs">No message to analyse.</p>
      </div>
    );
  }

  const ranges = buildHighlightRanges(message, safeSignals);
  const highlightedIds = new Set(ranges.map((range) => range.signalId));

  return (
    <motion.div
      className="space-y-3"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
    >
      <div className="max-h-[340px] overflow-y-auto rounded-xl border border-line bg-ink/60 p-4 scrollbar-thin sm:p-5">
        <div className="whitespace-pre-line break-words text-[13.5px] leading-7 text-slate-200">
          {renderMessage(message, ranges)}
        </div>
      </div>

      {safeSignals.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {safeSignals.map((signal) => {
            const meta = getSignalMeta(signal.id);
            const accent = ACCENTS[meta.accent] || ACCENTS.violet;
            const highlighted = highlightedIds.has(signal.id);
            return (
              <span
                key={signal.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] ${accent.bg} ${accent.border} ${accent.text} ${highlighted ? '' : 'opacity-70'}`}
                title={highlighted ? 'Exact phrase highlighted above' : 'Signal applies to the message as a whole'}
              >
                <span className={`h-1 w-1 rounded-full ${accent.dot}`} />
                {meta.short}
              </span>
            );
          })}
        </div>
      ) : null}

      {highlightedIds.size > 0 && highlightedIds.size < safeSignals.length ? (
        <p className="text-[10px] leading-relaxed text-faint">
          Some signals describe the message as a whole and have no single matching phrase to highlight.
        </p>
      ) : null}
    </motion.div>
  );
}
