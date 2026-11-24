# Threat Intelligence Integration

This document describes PAKSH's optional external threat-intelligence provider: Google Safe Browsing.

## Overview

PAKSH's deterministic risk indicator is produced entirely by the local rules engine (Layer 1). External reputation is **corroboration only** — it is displayed in a dedicated panel and **never changes the score or verdict**.

## Provider: Google Safe Browsing

- **API**: Safe Browsing API v4 (`threatMatches:find`)
- **Threat types**: MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE, POTENTIALLY_HARMFUL_APPLICATION
- **Platforms**: ANY_PLATFORM
- **Entry type**: URL
- **Max URLs per request**: 5
- **Timeout**: 4 s server-side, 4.5 s client-side

## Server endpoint

`POST /api/url-check`

### Request

```json
{ "urls": ["https://example.com/phish", "http://bit.ly/xyz"] }
```

### Response (success, configured)

```json
{
  "provider": "google-safe-browsing",
  "configured": true,
  "checked": ["https://example.com/phish", "http://bit.ly/xyz"],
  "matches": [
    { "url": "https://example.com/phish", "threatType": "SOCIAL_ENGINEERING" }
  ],
  "error": null,
  "note": "One or more URLs matched a known threat list."
}
```

### Response (success, no matches)

```json
{
  "provider": "google-safe-browsing",
  "configured": true,
  "checked": ["https://example.com/phish"],
  "matches": [],
  "error": null,
  "note": "No known threat matches returned. Not being listed is not proof of safety."
}
```

### Response (provider error / timeout)

```json
{
  "provider": "google-safe-browsing",
  "configured": true,
  "checked": ["https://example.com/phish"],
  "matches": [],
  "error": "Provider timed out.",
  "note": "External reputation was unavailable. Local URL signals still apply."
}
```

### Response (not configured)

```json
{
  "provider": "google-safe-browsing",
  "configured": false,
  "checked": ["https://example.com/phish"],
  "matches": [],
  "error": null,
  "note": "External reputation is not configured. Add GOOGLE_SAFE_BROWSING_API_KEY on the server to enable Google Safe Browsing lookups."
}
```

## Client behaviour

The client wrapper (`src/lib/reputation.js`) normalises every server response into a display-ready state:

| Status | Meaning | UI label |
|--------|---------|----------|
| `idle` | Not yet checked | — |
| `not_needed` | No URLs in message | — |
| `loading` | Request in flight | "Checking" |
| `ok` | Provider responded, matches may be 0 or >0 | "No match" / "Listed" |
| `not_configured` | No API key on server | "Not configured" |
| `unavailable` | Provider error / timeout / 404 | "Unavailable" |

The panel always shows the provider name, status chip, and a plain-language note. When matches exist, each threat type and URL is listed.

## Activation

1. Obtain a Google Safe Browsing API key from [Google Cloud Console](https://console.cloud.google.com/apis/library/safebrowsing.googleapis.com).
2. Enable the "Safe Browsing API".
3. Add `GOOGLE_SAFE_BROWSING_API_KEY` to the server environment (Vercel dashboard, `.env.local`, or your platform's secret store).
4. Redeploy / restart the serverless functions.

No frontend changes required.

## Limitations

- Safe Browsing covers known phishing, malware, and unwanted software lists. It is not exhaustive.
- A "No match" result means the URL was not on the list at query time — **not** a guarantee of safety.
- The local URL breakdown (shortener, HTTPS, lookalike, brand-like, raw IP, punycode) runs regardless and is always shown.
- PAKSH does not follow redirects, check domain age, or query WHOIS/DNS.

## Security

- The API key is **server-side only**. The browser never sees it.
- The `/api/url-check` endpoint validates input (max 5 URLs, max 2048 chars each, http/https only).
- Requests are aborted after 4 s to stay within Vercel hobby limits.
- All provider errors are surfaced honestly; the UI never pretends a check succeeded when it did not.