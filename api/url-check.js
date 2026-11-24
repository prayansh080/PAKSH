/**
 * Vercel serverless function: /api/url-check
 *
 * External URL reputation via Google Safe Browsing (documented, key-based API).
 *
 * Honest behaviour:
 *  - No key configured  -> 200 { configured: false, ... }  (never fabricate a check)
 *  - Provider failure   -> 200 { configured: true, error, matches: [] }
 *  - Success            -> 200 { configured: true, matches: [...] }
 *
 * This endpoint is corroboration only. The deterministic PAKSH risk score is
 * produced by the browser rules engine and is never changed by this result.
 *
 * Activate with: GOOGLE_SAFE_BROWSING_API_KEY (server-side only).
 */

const PROVIDER = 'google-safe-browsing';
const MAX_URLS = 5;
const MAX_URL_LENGTH = 2048;

function normalizeBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function validHttpUrl(value) {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > MAX_URL_LENGTH) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = normalizeBody(req.body);
  const urls = Array.isArray(body.urls) ? body.urls.filter(validHttpUrl).slice(0, MAX_URLS) : [];

  if (urls.length === 0) {
    return res.status(400).json({
      provider: PROVIDER,
      configured: Boolean(process.env.GOOGLE_SAFE_BROWSING_API_KEY),
      checked: [],
      matches: [],
      error: 'No valid http(s) URLs supplied.'
    });
  }

  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    return res.status(200).json({
      provider: PROVIDER,
      configured: false,
      checked: urls,
      matches: [],
      error: null,
      note:
        'External reputation is not configured. Add GOOGLE_SAFE_BROWSING_API_KEY on the server to enable Google Safe Browsing lookups.'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: { clientId: 'paksh', clientVersion: '1.0.0' },
          threatInfo: {
            threatTypes: [
              'MALWARE',
              'SOCIAL_ENGINEERING',
              'UNWANTED_SOFTWARE',
              'POTENTIALLY_HARMFUL_APPLICATION'
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: urls.map((url) => ({ url }))
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(200).json({
        provider: PROVIDER,
        configured: true,
        checked: urls,
        matches: [],
        error: `Provider returned HTTP ${response.status}.`,
        note: 'External reputation was unavailable. Local URL signals still apply.'
      });
    }

    const data = await response.json();
    const matches = Array.isArray(data.matches)
      ? data.matches.map((match) => ({
          url: match?.threat?.url || '',
          threatType: match?.threatType || 'UNKNOWN'
        }))
      : [];

    return res.status(200).json({
      provider: PROVIDER,
      configured: true,
      checked: urls,
      matches,
      error: null,
      note:
        matches.length === 0
          ? 'No known threat matches returned. Not being listed is not proof of safety.'
          : 'One or more URLs matched a known threat list.'
    });
  } catch (err) {
    clearTimeout(timeout);
    return res.status(200).json({
      provider: PROVIDER,
      configured: true,
      checked: urls,
      matches: [],
      error: err && err.name === 'AbortError' ? 'Provider timed out.' : 'Provider request failed.',
      note: 'External reputation was unavailable. Local URL signals still apply.'
    });
  }
}
