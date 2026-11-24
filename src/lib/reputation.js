/**
 * Client wrapper for the optional external URL reputation provider.
 *
 * Returns a normalized, display-ready state. It never invents results:
 * every state maps to something the server actually reported.
 */

const DEFAULT_TIMEOUT_MS = 4500;

export const REPUTATION_STATE = {
  IDLE: 'idle',
  NOT_NEEDED: 'not_needed',
  LOADING: 'loading',
  OK: 'ok',
  NOT_CONFIGURED: 'not_configured',
  UNAVAILABLE: 'unavailable'
};

export function initialReputation() {
  return {
    status: REPUTATION_STATE.IDLE,
    provider: 'google-safe-browsing',
    configured: null,
    checked: [],
    matches: [],
    note: '',
    error: null
  };
}

export async function checkUrlReputation(urls, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return { ...initialReputation(), status: REPUTATION_STATE.NOT_NEEDED };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('/api/url-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: urls.slice(0, 5) }),
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        ...initialReputation(),
        status: REPUTATION_STATE.UNAVAILABLE,
        checked: urls,
        error: `Endpoint returned HTTP ${response.status}.`,
        note: 'External reputation was unavailable. Local URL signals still apply.'
      };
    }

    const data = await response.json();

    if (data.configured === false) {
      return {
        ...initialReputation(),
        status: REPUTATION_STATE.NOT_CONFIGURED,
        provider: data.provider || 'google-safe-browsing',
        configured: false,
        checked: Array.isArray(data.checked) ? data.checked : urls,
        note: data.note || 'External reputation is not configured.',
        error: data.error || null
      };
    }

    if (data.error) {
      return {
        ...initialReputation(),
        status: REPUTATION_STATE.UNAVAILABLE,
        provider: data.provider || 'google-safe-browsing',
        configured: true,
        checked: Array.isArray(data.checked) ? data.checked : urls,
        matches: Array.isArray(data.matches) ? data.matches : [],
        note: data.note || 'External reputation was unavailable.',
        error: data.error
      };
    }

    return {
      ...initialReputation(),
      status: REPUTATION_STATE.OK,
      provider: data.provider || 'google-safe-browsing',
      configured: true,
      checked: Array.isArray(data.checked) ? data.checked : urls,
      matches: Array.isArray(data.matches) ? data.matches : [],
      note: data.note || '',
      error: null
    };
  } catch (error) {
    return {
      ...initialReputation(),
      status: REPUTATION_STATE.UNAVAILABLE,
      checked: urls,
      error: error && error.name === 'AbortError' ? 'Reputation check timed out.' : 'Reputation check could not be reached.',
      note: 'External reputation was unavailable. Local URL signals still apply.'
    };
  } finally {
    clearTimeout(timer);
  }
}
