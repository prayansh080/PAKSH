/**
 * Local URL trust signals. Rules only: no redirect tracing, no domain-age
 * claims, no external calls. Wording stays honest: "brand-like, not verified
 * as official" rather than "this domain is fake".
 */

const SHORTENERS = [
  'bit.ly', 'tinyurl', 't.co', 'ow.ly', 'rebrand.ly', 'cutt.ly',
  'shorturl', 'tiny.cc', 'is.gd', 'buff.ly', 'adf.ly', 'bitly.com',
  'tinyurl.com'
];

const LOOKALIKES = [
  'amaz0n', 'amaz0ns', 'g00gle', 'g00g1e', 'faceb00k', 'flipkartt',
  'paytm1', 'phonepee', 'gooogle', 'amazn', 'flipkart-official',
  'paytm-official', 'sbi-online'
];

const BRANDS = [
  'amazon', 'flipkart', 'paytm', 'phonepe', 'google', 'facebook',
  'whatsapp', 'instagram', 'twitter', 'linkedin', 'microsoft', 'apple',
  'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'bankofbaroda', 'canara',
  'pnb', 'rbi', 'upi', 'govt', 'government', 'courier', 'dtdc', 'fedex',
  'bluedart', 'indiapost', 'customs', 'cbi', 'incometax', 'income tax'
];

const OFFICIAL_SUFFIXES = ['.gov.in', '.edu.in', '.ac.in', '.nic.in'];

const URL_REGEX =
  /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}\/[^\s<>"']*/g;

/**
 * Extract unique URLs from a message using the same pattern as the rules engine.
 */
export function extractUrls(text) {
  if (!text) return [];
  const matches = String(text).match(URL_REGEX) || [];
  return Array.from(new Set(matches.map((url) => url.replace(/[.,;:)\]]+$/, ''))));
}

export function analyzeURL(url) {
  if (!url) return null;

  const raw = String(url).trim();
  const lower = raw.toLowerCase();
  const flags = [];

  const hasProtocol = /^https?:\/\//i.test(lower);
  const https = lower.startsWith('https://');

  const withoutProtocol = lower.replace(/^https?:\/\//, '');
  const host = withoutProtocol.split('/')[0].split('?')[0].split('#')[0];
  const path = withoutProtocol.slice(host.length) || '';

  const shortener = SHORTENERS.some((s) => host === s || host.endsWith(`.${s}`) || lower.includes(`/${s}`));
  const rawIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
  const lookalike = LOOKALIKES.some((l) => host.includes(l));
  const hasBrand = BRANDS.some((b) => host.includes(b));
  const isOfficial = OFFICIAL_SUFFIXES.some((suffix) => host.endsWith(suffix));
  const brandLike = hasBrand && !isOfficial;
  const punycode = host.includes('xn--');

  if (!hasProtocol) flags.push('No explicit protocol');
  else if (!https) flags.push('No HTTPS');
  if (shortener) flags.push('URL shortener');
  if (rawIP) flags.push('Raw IP address');
  if (lookalike) flags.push('Lookalike characters');
  if (brandLike) flags.push('Brand-like, not verified official');
  if (punycode) flags.push('Punycode domain');
  if (path.length > 40) flags.push('Long path');

  let riskLevel = 'low';
  if (flags.length >= 3) riskLevel = 'high';
  else if (flags.length >= 1) riskLevel = 'medium';

  return {
    url: raw,
    domain: host,
    path,
    https,
    shortener,
    lookalike,
    brandLike,
    rawIP,
    punycode,
    isOfficial,
    flags,
    signals: flags,
    riskLevel
  };
}
