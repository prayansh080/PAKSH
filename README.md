# PAKSH — Digital Deception Intelligence

> **See the other side.**

PAKSH is a cybersecurity intelligence tool for analysing suspicious messages — fake internship offers, KYC phishing, OTP theft, payment scams, courier fraud, and more. It runs a deterministic rules engine in your browser, optionally enriches the result with server-side AI context and URL reputation, and presents an explainable intelligence report.

## Features

- **Local-first rules engine** — six signal types, fixed weights, deterministic 0–100 risk indicator. Works offline, no API keys required.
- **Evidence highlighting** — only exact phrases that triggered a rule are marked in the original message.
- **ScamDNA pattern map** — six stage classes (data theft, payment trap, fake authority, urgency, off-platform, link trap) light up only when supported by evidence.
- **Scam Autopsy** — explains how each detected pattern appears to work, with cautious wording.
- **Safety actions** — concrete next steps tied to each signal; India-specific reporting resources for elevated risk.
- **Threat intelligence panel** — local URL breakdown + optional Google Safe Browsing corroboration (never changes the score).
- **Three separate intelligence layers** — clearly labelled: local rules (always), AI context (optional), external reputation (optional).
- **Premium dark UI** — glassmorphism panels, cyan/violet/electric accents, responsive 390px–1440px, reduced-motion respect, keyboard accessible.
- **No fabricated data** — every claim traces to a rule or an explicitly labelled source.

## Quick start

```bash
# 1. Clone / open the repo
cd trustlens

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser. The rules engine runs immediately; AI and reputation features require server-side keys (see below).

## Optional server-side features

### AI context (Gemini)

Add a `.env.local` or configure Vercel environment variables:

```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-1.5-flash
```

Without this, the report shows `AI context was unavailable. Rules-only analysis used.`

### External URL reputation (Google Safe Browsing)

```
GOOGLE_SAFE_BROWSING_API_KEY=your_key_here
```

Without this, the threat-intel panel reads `Not configured. Add GOOGLE_SAFE_BROWSING_API_KEY on the server to enable real lookups.`

Both keys are **server-side only** — never exposed to the browser.

## Test suite

```bash
# Rules engine false-positive tests
node test/false-positives.mjs

# Demo cases (known scams + safe messages)
node demo-cases.mjs

# SSR render smoke test (24 cases, animated + reduced-motion)
node test/render-smoke.mjs

# Production build
npm run build
```

## Project structure

```
trustlens/
├── api/
│   ├── analyze.js      # /api/analyze — Gemini AI context
│   └── url-check.js    # /api/url-check — Google Safe Browsing
├── src/
│   ├── components/     # React components (Scanner, ReportLayout, etc.)
│   ├── lib/
│   │   ├── rules.js        # Layer 1: deterministic browser rules
│   │   ├── merge.js        # Layer 3: merge rules + AI (score never changes)
│   │   ├── urlSignals.js   # Local URL analysis
│   │   ├── reputation.js   # Client wrapper for /api/url-check
│   │   ├── signals.js      # Shared signal metadata + ScamDNA stages
│   │   └── samples.js      # Sample chips for the scanner
│   ├── App.jsx         # Main app shell + staged scan orchestration
│   ├── main.jsx
│   └── index.css       # Design system (tokens, glass, grid, animations)
├── public/paksh.svg    # Favicon / brand mark
├── index.html
├── tailwind.config.js
├── vercel.json         # Routes for /api/analyze and /api/url-check
├── .env.example
├── test/
│   ├── false-positives.mjs
│   └── render-smoke.mjs
├── demo-cases.mjs
└── docs/
    └── threat-intelligence.md
```

## Design principles

1. **Score is rules-only** — AI and reputation never alter the deterministic 0–100 indicator.
2. **No invented checks** — external reputation is either configured and reported honestly, or shown as unavailable.
3. **Explainable by design** — every highlight, weight, and recommendation traces to a detected signal.
4. **Privacy first** — message analysed in browser by default; sent to server only when optional features are enabled.
5. **Honest fallback** — plain `vite dev` returns 404 for API endpoints; rules-only analysis is the tested path.

## Verdict thresholds

| Verdict      | Score | Meaning                                      |
|--------------|-------|----------------------------------------------|
| HIGH RISK    | ≥ 30  | Strong evidence (credential theft, upfront payment, multiple signals) |
| SUSPICIOUS   | ≥ 20  | Moderate evidence (urgency, impersonation, suspicious URL) |
| LOW RISK     | < 20  | Weak or no evidence — never a guarantee of safety |

## Local run command

```bash
cd trustlens && npm install && npm run dev
```

## License

Educational / demonstration purposes. Not a substitute for professional security advice.