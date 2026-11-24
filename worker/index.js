/**
 * PAKSH — Cloudflare Worker entry.
 *
 * Serves the built SPA from the assets binding and implements the two optional
 * server-side endpoints (`/api/analyze`, `/api/url-check`) as fetch handlers.
 * The browser rules engine is the only thing that produces a score; these
 * endpoints can only add explanation text or reputation corroboration, and both
 * report "not configured" honestly when their key is absent.
 *
 * Secrets (optional): GEMINI_API_KEY, GEMINI_MODEL, GOOGLE_SAFE_BROWSING_API_KEY
 */

const PROVIDER = 'google-safe-browsing';
const MAX_URLS = 5;
const MAX_URL_LENGTH = 2048;
const MAX_BODY_BYTES = 120000;

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function readJsonBody(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { error: 'Request body too large.' };
  if (!text) return { body: {} };
  try {
    const parsed = JSON.parse(text);
    return { body: parsed && typeof parsed === 'object' ? parsed : {} };
  } catch {
    return { error: 'Invalid JSON body.' };
  }
}

function methodGuard(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  return null;
}

/* -------------------------------------------------------------------------- */
/* /api/analyze — optional AI explanation (never the score)                    */
/* -------------------------------------------------------------------------- */

const SCHEMA = {
  type: 'object',
  properties: {
    extractedText: { type: 'string' },
    category: {
      type: 'string',
      enum: [
        'fake_internship',
        'kyc_phishing',
        'courier_scam',
        'scholarship_scam',
        'upi_fraud',
        'job_scam',
        'other',
        'safe'
      ]
    },
    confidence: { type: 'number', minimum: 0, maximum: 100 },
    summary: { type: 'string' },
    dna: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          stage: { type: 'string' },
          present: { type: 'boolean' },
          phrase: { type: 'string' },
          psychology: { type: 'string' },
          goal: { type: 'string' }
        },
        required: ['stage', 'present', 'phrase', 'psychology', 'goal']
      }
    },
    evidence: { type: 'array', items: { type: 'string' } },
    actions: { type: 'array', items: { type: 'string' } }
  },
  required: ['extractedText', 'category', 'confidence', 'summary', 'dna', 'evidence', 'actions']
};

function unavailable(reason, message) {
  return {
    available: false,
    reason,
    extractedText: message || '',
    category: 'other',
    confidence: 50,
    summary:
      reason === 'timeout'
        ? 'AI context timed out; rules-based analysis used.'
        : reason === 'not_configured'
          ? 'AI context is not configured; rules-based analysis used.'
          : 'AI context failed; rules-based analysis used.',
    dna: [],
    evidence: [],
    actions: []
  };
}

async function handleAnalyze(request, env) {
  const guard = methodGuard(request);
  if (guard) return guard;

  const { body, error } = await readJsonBody(request);
  if (error) return json({ error }, 400);

  const message = typeof body.message === 'string' ? body.message.slice(0, 8000) : '';
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  const rules = body.rules;

  if (!message && !imageBase64) {
    return json({ error: 'Message or image required' }, 400);
  }

  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    return json(unavailable('not_configured', message));
  }

  const parts = [];

  if (imageBase64) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
  }

  const rulesText = rules
    ? `\n\nRules engine detected these signals:\n${JSON.stringify(rules, null, 2)}\n`
    : '';

  parts.push({
    text: `You are PAKSH, an explainable scam verifier for Indian students.

Analyze the following message${imageBase64 ? ' (screenshot attached)' : ''}.${rulesText}

Rules:
- Return STRICT JSON only. No markdown, no explanation outside JSON.
- Do not invent evidence not present in the message.
- If the message is safe, set category to "safe" and dna present flags to false.
- Support English, Hindi, and Hinglish.
- Keep summary short and honest.

Message: "${message}"

Respond with this exact JSON schema:
${JSON.stringify(SCHEMA, null, 2)}`
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
            responseSchema: SCHEMA
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return json(unavailable('provider_error', message));
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    try {
      const parsed = JSON.parse(rawText);
      return json({ available: true, ...parsed });
    } catch {
      return json(unavailable('unparseable', message));
    }
  } catch (err) {
    clearTimeout(timeout);
    return json(unavailable(err && err.name === 'AbortError' ? 'timeout' : 'provider_error', message));
  }
}

/* -------------------------------------------------------------------------- */
/* /api/url-check — optional external reputation (corroboration only)          */
/* -------------------------------------------------------------------------- */

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

async function handleUrlCheck(request, env) {
  const guard = methodGuard(request);
  if (guard) return guard;

  const { body, error } = await readJsonBody(request);
  if (error) return json({ error }, 400);

  const urls = Array.isArray(body.urls) ? body.urls.filter(validHttpUrl).slice(0, MAX_URLS) : [];

  if (urls.length === 0) {
    return json({
      provider: PROVIDER,
      configured: Boolean(env.GOOGLE_SAFE_BROWSING_API_KEY),
      checked: [],
      matches: [],
      error: 'No valid http(s) URLs supplied.'
    }, 400);
  }

  const apiKey = env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    return json({
      provider: PROVIDER,
      configured: false,
      checked: urls,
      matches: [],
      error: null,
      note: 'External reputation is not configured. Local URL signals still apply.'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
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
      return json({
        provider: PROVIDER,
        configured: true,
        checked: urls,
        matches: [],
        error: `Provider returned HTTP ${response.status}.`,
        note: 'External reputation was unavailable. Local URL signals still apply.'
      });
    }

    const data = await response.json();
    const matches = Array.isArray(data?.matches)
      ? data.matches.map((match) => ({
          url: match?.threat?.url || '',
          threatType: match?.threatType || 'UNKNOWN'
        }))
      : [];

    return json({
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
    return json({
      provider: PROVIDER,
      configured: true,
      checked: urls,
      matches: [],
      error: err && err.name === 'AbortError' ? 'Provider timed out.' : 'Provider request failed.',
      note: 'External reputation was unavailable. Local URL signals still apply.'
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Router                                                                     */
/* -------------------------------------------------------------------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/analyze') return handleAnalyze(request, env);
    if (url.pathname === '/api/url-check') return handleUrlCheck(request, env);
    if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);

    const response = await env.ASSETS.fetch(request);

    // Client-side routes must fall back to the SPA shell.
    if (
      response.status === 404 &&
      request.method === 'GET' &&
      (request.headers.get('accept') || '').includes('text/html')
    ) {
      const shell = await env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
      return new Response(shell.body, {
        status: 200,
        headers: shell.headers
      });
    }

    return response;
  }
};
