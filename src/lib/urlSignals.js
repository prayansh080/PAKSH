/**
 * URL trust signals for the TrustCard (rules only, no redirect tracing, no age claims).
 * Honest wording: "brand-like, not verified as official" — never "this domain is fake".
 */

export function analyzeURL(url) {
  if (!url) return null;

  const u = url.toLowerCase();
  const signals = [];
  let https = false;
  let shortener = false;
  let lookalike = false;
  let brandLike = false;
  let rawIP = false;

  // HTTPS
  https = u.startsWith('https://');

  // Shortener
  const shorteners = [
    'bit.ly', 'tinyurl', 't.co', 'ow.ly', 'rebrand.ly', 'cutt.ly',
    'shorturl', 'tiny.cc', 'is.gd', 'buff.ly', 'adf.ly'
  ];
  shortener = shorteners.some((s) => u.includes(s));

  // Raw IP
  const host = u.replace('https://', '').replace('http://', '').split('/')[0];
  rawIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);

  // Lookalike
  const lookalikes = ['amaz0n', 'g00gle', 'faceb00k', 'flipkartt', 'paytm1'];
  lookalike = lookalikes.some((l) => host.includes(l));

  // Brand-like but unofficial
  const brands = ['amazon', 'flipkart', 'paytm', 'sbi', 'hdfc', 'icici', 'axis'];
  const hasBrand = brands.some((b) => host.includes(b));
  const isOfficial = host.endsWith('.gov.in') || host.endsWith('.edu.in') || host.endsWith('.ac.in');
  brandLike = hasBrand && !isOfficial;

  if (shortener) signals.push('URL shortener detected');
  if (!https) signals.push('No HTTPS encryption');
  if (rawIP) signals.push('Raw IP address instead of domain');
  if (lookalike) signals.push('Lookalike / brand-like domain');
  if (brandLike) signals.push('Brand-like name, not verified as an official domain');

  return {
    url,
    domain: host,
    https,
    shortener,
    lookalike,
    brandLike,
    rawIP,
    signals,
    riskLevel: signals.length > 2 ? 'high' : signals.length > 0 ? 'medium' : 'low'
  };
}