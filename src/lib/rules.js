/**
 * Layer 1: Browser-side explainable rules engine.
 * Returns a rules report with signals, weights, and a capped score.
 *
 * Deterministic: same input always produces same output.
 * No randomness, no AI dependency, no external state.
 */

// Safe-context signals. If present, weak scam signals are suppressed.
// Strong scam signals (OTP demand, upfront payment) always fire regardless.
const SAFE_SIGNALS = [
  'college', 'fest', 'placement cell', 'placement', 'exam', 'examination',
  'university', 'campus', 'student', 'sports', 'cultural', 'seminar',
  'webinar', 'workshop', 'admission', 'result', 'merit', 'notice',
  'circular', 'official', 'holiday', 'library', 'fee portal',
  '.edu.in', '.ac.in', '.gov.in', '.nic.in'
];

// Strong scam signals that always fire even inside a safe context.
// These are used only for suppression logic, not for additional scoring.
const STRONG_SIGNALS = ['otp', 'password', 'pin', 'cvv', 'payment', 'fee', 'deposit'];

const URL_SHORTENERS = [
  'bit.ly', 'tinyurl', 't.co', 'ow.ly', 'rebrand.ly', 'cutt.ly', 'shorturl',
  'tiny.cc', 'is.gd', 'buff.ly', 'adf.ly', 'bitly.com', 'tinyurl.com'
];

const LOOKALIKES = [
  'amaz0n', 'amaz0ns', 'g00gle', 'g00g1e', 'faceb00k', 'flipkartt',
  'paytm1', 'phonepee', 'gooogle', 'amazn', 'flipkart-official',
  'paytm-official', 'sbi-online', 'hdfcbank'
];

const BRANDS = [
  'amazon', 'flipkart', 'paytm', 'phonepe', 'google', 'facebook',
  'whatsapp', 'instagram', 'twitter', 'linkedin', 'microsoft', 'apple',
  'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'bankofbaroda', 'canara',
  'pnb', 'rbi', 'upi', 'govt', 'government', 'courier', 'dtdc', 'fedex',
  'bluedart', 'indiapost', 'customs', 'cbi', 'incometax', 'income tax'
];

const OTP_KEYWORDS = [
  'otp', 'one time password', 'password', 'pin', 'cvv', 'card number',
  'aadhaar', 'pan card', 'verify your account', 'account verify',
  'kyc update', 'share your', 'send us', 'provide your', 'enter your otp',
  'otp number', 'transaction password'
];

const PAYMENT_KEYWORDS = [
  'registration fee', 'processing charge', 'processing fee', 'deposit',
  'refundable fee', 'upfront payment', 'pay today', 'pay now',
  'confirm your position', 'confirm seat', 'booking amount', 'token amount',
  'advance payment', 'pay to confirm', '₹', 'rs.', 'inr', 'transfer',
  'send money', 'gpay', 'phonepe', 'paytm'
];

const URGENCY_KEYWORDS = [
  'today only', 'last chance', 'within 24 hours', 'within 24hrs',
  'account will be blocked', 'account blocked', 'suspended', 'expire',
  'expires', 'immediately', 'urgent', 'act now', 'limited time',
  'hurry', 'final notice', 'last date', 'before it expires'
];

const OFFPLATFORM_KEYWORDS = [
  'telegram', 'whatsapp only', 'whatsapp-only', 'contact hr', 'hr on',
  'gmail.com', 'outlook.com', 'yahoo.com', 'recruiter', 'hr@gmail',
  'only on telegram', 'msg us', 'message us on', 'whatsapp number',
  'call this number', 'direct message', 'dm us'
];

const IMPERSONATION_KEYWORDS = [
  'bank', 'sbi', 'hdfc', 'icici', 'axis', 'rbi', 'courier', 'customs',
  'government', 'govt', 'official', 'department', 'ministry',
  'income tax', 'dtdc', 'fedex', 'bluedart', 'indiapost', 'company',
  'hr department', 'recruitment team', 'your bank', 'kyc'
];

function containsAny(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

function findURLs(text) {
  // Supports subdomains (e.g. college.edu.in/fees) by allowing repeated .label segments.
  const urlRegex =
    /https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}\/[^\s]*/g;
  return text.match(urlRegex) || [];
}

/**
 * Maps a numeric score to a three-tier verdict.
 * Thresholds are evidence-based:
 *   HIGH RISK   >= 30  (strong evidence: credential theft, upfront payment, multiple signals)
 *   SUSPICIOUS  >= 20  (moderate evidence: urgency, impersonation, suspicious URL)
 *   LOW RISK    < 20   (weak or no evidence — never a guarantee of safety)
 *
 * Urgency alone (+10) stays LOW RISK — it never auto-escalates to HIGH RISK.
 * Payment alone (+25) stays SUSPICIOUS — not automatically a scam.
 * OTP alone (+30) reaches HIGH RISK — strong credential theft stays important.
 */
function scoreToVerdict(score) {
  if (score >= 30) return 'HIGH RISK';
  if (score >= 20) return 'SUSPICIOUS';
  return 'LOW RISK';
}

function scoreToSeverity(score) {
  if (score >= 30) return 'critical';
  if (score >= 20) return 'high';
  if (score > 0) return 'medium';
  return 'safe';
}

export function analyzeRules(message) {
  const text = message || '';
  const lower = text.toLowerCase();
  const signals = [];
  let score = 0;

  const hasSafeSignal = containsAny(text, SAFE_SIGNALS);
  const seenSignalIds = new Set(); // prevents duplicate signal counting

  // 1. OTP / password / PIN / CVV request — +30 (always fires, even in safe context)
  if (containsAny(text, OTP_KEYWORDS) && !seenSignalIds.has('otp-request')) {
    signals.push({
      id: 'otp-request',
      label: 'OTP / password / PIN / CVV request',
      severity: 'critical',
      weight: 30,
      evidence: 'Message asks for OTP, password, PIN, CVV, Aadhaar, PAN, or personal ID details'
    });
    seenSignalIds.add('otp-request');
    score += 30;
  }

  // 2. Upfront payment — +25
  // Suppressed inside a verified safe context unless a strong scam signal is also present.
  const paymentMatched = containsAny(text, PAYMENT_KEYWORDS);
  if (paymentMatched && !seenSignalIds.has('upfront-payment')) {
    const inSafeContext = hasSafeSignal && !containsAny(text, STRONG_SIGNALS);
    if (!inSafeContext) {
      signals.push({
        id: 'upfront-payment',
        label: 'Upfront payment demand',
        severity: 'high',
        weight: 25,
        evidence: 'Message asks for registration fee, deposit, processing charge, or advance payment'
      });
      seenSignalIds.add('upfront-payment');
      score += 25;
    }
  }

  // 3. Suspicious URL — +20 (one URL signal only; don't double count related URL hits)
  const urls = findURLs(text);
  let suspiciousUrl = false;
  let urlEvidence = '';
  let brandLike = false;

  if (urls.length > 0) {
    for (const url of urls) {
      const u = url.toLowerCase();
      let isSuspicious = false;
      let reason = '';

      // Shortener
      if (URL_SHORTENERS.some((s) => u.includes(s))) {
        isSuspicious = true;
        reason = 'URL shortener detected';
      }
      // No HTTPS — but exempt official domains (.gov.in, .edu.in, .ac.in, .nic.in)
      else if (!u.startsWith('https://')) {
        const domain = u
          .replace('https://', '')
          .replace('http://', '')
          .split('/')[0];
        const isOfficial =
          domain.endsWith('.gov.in') ||
          domain.endsWith('.edu.in') ||
          domain.endsWith('.ac.in') ||
          domain.endsWith('.nic.in');
        if (!isOfficial) {
          isSuspicious = true;
          reason = 'No HTTPS';
        }
      }
      // Raw IP address
      else if (
        /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(
          u.replace('https://', '').replace('http://', '').split('/')[0]
        )
      ) {
        isSuspicious = true;
        reason = 'Raw IP address';
      }
      // Lookalike
      else if (LOOKALIKES.some((l) => u.includes(l))) {
        isSuspicious = true;
        brandLike = true;
        reason = 'Lookalike / brand-like domain';
      }
      // Brand in unofficial domain
      else {
        const domain = u
          .replace('https://', '')
          .replace('http://', '')
          .split('/')[0];
        const hasBrand = BRANDS.some((b) => domain.includes(b));
        const isOfficial =
          domain.endsWith('.gov.in') ||
          domain.endsWith('.edu.in') ||
          domain.endsWith('.ac.in') ||
          domain.endsWith('.nic.in');
        if (hasBrand && !isOfficial) {
          isSuspicious = true;
          brandLike = true;
          reason = 'Brand-like name, not verified as an official domain';
        }
      }

      if (isSuspicious) {
        suspiciousUrl = true;
        urlEvidence = reason;
        break; // one URL signal only
      }
    }
  }

  if (suspiciousUrl && !seenSignalIds.has('suspicious-url')) {
    signals.push({
      id: 'suspicious-url',
      label: 'Suspicious URL',
      severity: 'high',
      weight: 20,
      evidence: urlEvidence || 'Suspicious link detected'
    });
    seenSignalIds.add('suspicious-url');
    score += 20;
  }

  // 4. Impersonation — +15 (skip if brand-like URL already caught it)
  const alreadyBrandLike = signals.some(
    (s) => s.id === 'suspicious-url' && brandLike
  );
  if (
    containsAny(text, IMPERSONATION_KEYWORDS) &&
    !alreadyBrandLike &&
    !seenSignalIds.has('impersonation')
  ) {
    if (!hasSafeSignal || containsAny(text, STRONG_SIGNALS)) {
      signals.push({
        id: 'impersonation',
        label: 'Impersonation of company / bank / government / courier',
        severity: 'medium',
        weight: 15,
        evidence: 'Message claims to be from a company, bank, government body, or courier service'
      });
      seenSignalIds.add('impersonation');
      score += 15;
    }
  }

  // 5. Artificial urgency — +10
  if (containsAny(text, URGENCY_KEYWORDS) && !seenSignalIds.has('urgency')) {
    signals.push({
      id: 'urgency',
      label: 'Artificial urgency',
      severity: 'medium',
      weight: 10,
      evidence: 'Message uses time pressure (today only, last chance, account blocked, etc.)'
    });
    seenSignalIds.add('urgency');
    score += 10;
  }

  // 6. Off-platform contact — +10
  if (containsAny(text, OFFPLATFORM_KEYWORDS) && !seenSignalIds.has('off-platform')) {
    signals.push({
      id: 'off-platform',
      label: 'Off-platform contact',
      severity: 'medium',
      weight: 10,
      evidence: 'Message pushes contact to Telegram, WhatsApp-only, or personal recruiter email'
    });
    seenSignalIds.add('off-platform');
    score += 10;
  }

  const finalScore = Math.min(100, score);
  const verdict = scoreToVerdict(finalScore);
  const severity = scoreToSeverity(finalScore);

  return {
    score: finalScore,
    verdict,
    severity,
    signals,
    signalCount: signals.length,
    hasSignals: signals.length > 0,
    riskLabel: 'Risk indicator score — not a probability of fraud.'
  };
}