/**
 * Render smoke test.
 *
 * Bundles the real report components with esbuild and renders them through
 * react-dom/server. This executes the components at runtime, so it catches
 * undefined identifiers and bad props that a Vite build does not (a bundler
 * treats an undefined name as a possible global and leaves it in place).
 *
 * Run: node test/render-smoke.mjs
 */
import { build } from 'esbuild';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const source = `
import React from 'react';
import { renderToString } from 'react-dom/server';
import { analyzeRules } from './src/lib/rules.js';
import { mergeReport } from './src/lib/merge.js';
import { analyzeURL } from './src/lib/urlSignals.js';
import { ReportLayout } from './src/components/ReportLayout.jsx';

const LONG_TEXT = Array.from({ length: 40 })
  .map(() => 'Notice: the annual college fest will be held on 12 March in the main campus auditorium.')
  .join('\\n');

const cases = [
  {
    name: 'Fake internship (rules only)',
    expect: 'HIGH RISK',
    text: 'Congratulations! You are selected for a paid internship at Infosys. Pay 1,499 registration fee today to confirm your position. Contact HR on Telegram: @infosys_hr. Today only!',
    mustContain: ['internship', 'registration fee', 'Telegram', 'Today only'],
  },
  {
    name: 'Safe college announcement (rules only)',
    expect: 'LOW RISK',
    text: 'Notice: The annual college fest will be held on 12 March in the main campus auditorium. All students are welcome. Details on the notice board.',
    mustContain: ['annual college fest', 'main campus auditorium', 'notice board'],
  },
  {
    name: 'KYC phishing link (rules only)',
    expect: 'HIGH RISK',
    text: 'Dear customer, your SBI account will be blocked today. Complete KYC immediately at http://sbi-verify.xyz/kyc to avoid suspension.',
    mustContain: ['Dear customer', 'sbi-verify.xyz/kyc', 'avoid suspension'],
    urlDetails: ['http://sbi-verify.xyz/kyc'].map((url) => analyzeURL(url)),
  },
  {
    name: 'OTP request (rules only)',
    expect: 'HIGH RISK',
    text: 'Share your OTP to verify your bank account or it will be blocked within 24 hours.',
    mustContain: ['Share your OTP', 'blocked within 24 hours'],
    mustContainAny: ['OTP / credential request', 'OTP / password / PIN / CVV request'],
  },
  {
    name: 'Payment only (rules only)',
    expect: 'SUSPICIOUS',
    text: 'Pay the refundable registration fee of 2,000 to confirm your seat for the workshop.',
    mustContain: ['refundable registration fee', 'confirm your seat'],
  },
  {
    name: 'Empty input',
    expect: 'LOW RISK',
    text: '',
    mustContain: ['No message to analyse'],
    skipFullMessage: true,
  },
  {
    name: 'Very long input',
    expect: 'LOW RISK',
    text: LONG_TEXT,
    mustContain: ['annual college fest', 'main campus auditorium'],
    fullMessage: LONG_TEXT,
  },
  {
    name: 'AI context available',
    expect: 'HIGH RISK',
    text: 'Selected for internship. Pay 1,499 today to confirm your position. Contact HR on Telegram.',
    ai: {
      available: true,
      category: 'fake_job_offer',
      confidence: 88,
      summary: 'This appears to combine an upfront fee with off-platform contact.',
      dna: [],
      evidence: [],
      actions: [],
    },
    mustContain: ['AI explanation', 'Available', 'fake_job_offer', 'advisory context only'],
  },
  {
    name: 'AI not configured',
    expect: 'HIGH RISK',
    text: 'Selected for internship. Pay 1,499 today to confirm your position. Contact HR on Telegram.',
    ai: { available: false, reason: 'not_configured' },
    mustContain: ['AI explanation', 'Not used', 'not configured'],
  },
  {
    name: 'Reputation not configured',
    expect: 'HIGH RISK',
    text: 'Your account will be blocked. Update KYC immediately through this link: http://bit.ly/verify-kyc',
    urlDetails: ['http://bit.ly/verify-kyc'].map((url) => analyzeURL(url)),
    reputation: {
      status: 'not_configured',
      provider: 'google-safe-browsing',
      configured: false,
      checked: ['http://bit.ly/verify-kyc'],
      matches: [],
      note: 'External reputation is not configured.',
      error: null,
    },
    mustContain: ['Not configured', 'GOOGLE_SAFE_BROWSING_API_KEY'],
  },
  {
    name: 'Reputation matched',
    expect: 'HIGH RISK',
    text: 'Your account will be blocked. Update KYC immediately through this link: http://bit.ly/verify-kyc',
    urlDetails: ['http://bit.ly/verify-kyc'].map((url) => analyzeURL(url)),
    reputation: {
      status: 'ok',
      provider: 'google-safe-browsing',
      configured: true,
      checked: ['http://bit.ly/verify-kyc'],
      matches: [{ url: 'http://bit.ly/verify-kyc', threatType: 'SOCIAL_ENGINEERING' }],
      note: '',
      error: null,
    },
    mustContain: ['Listed', 'Phishing / social engineering'],
  },
  {
    name: 'Reputation unavailable',
    expect: 'HIGH RISK',
    text: 'Your account will be blocked. Update KYC immediately through this link: http://bit.ly/verify-kyc',
    urlDetails: ['http://bit.ly/verify-kyc'].map((url) => analyzeURL(url)),
    reputation: {
      status: 'unavailable',
      provider: 'google-safe-browsing',
      configured: true,
      checked: ['http://bit.ly/verify-kyc'],
      matches: [],
      note: '',
      error: 'Provider timed out.',
    },
    mustContain: ['Unavailable', 'Provider timed out.'],
  },
];

const results = [];

function htmlToText(html) {
  return html
    .replace(/<span[^>]*data-tooltip="true"[^>]*>[\\s\\S]*?<\\/span>/g, '')
    .replace(/<!--[\\s\\S]*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

for (const testCase of cases) {
  const rules = analyzeRules(testCase.text);
  const report = mergeReport(rules, testCase.ai || null, testCase.text);

  for (const reducedMotion of [false, true]) {
    let html = '';
    let error = null;

    try {
      html = renderToString(
        React.createElement(ReportLayout, {
          report,
          message: testCase.text,
          reducedMotion,
          reputation: testCase.reputation || null,
          urlDetails: testCase.urlDetails || [],
        })
      );
    } catch (e) {
      error = e && e.message ? e.message : String(e);
    }

    const visibleText = htmlToText(html);
    const missing = (testCase.mustContain || []).filter((part) => !visibleText.includes(part));
    const anyMissing =
      testCase.mustContainAny && !testCase.mustContainAny.some((part) => visibleText.includes(part));
    const fullMessagePreserved = testCase.skipFullMessage
      ? true
      : visibleText.includes(testCase.fullMessage || testCase.text);
    const verdictOk = report.verdict === testCase.expect;

    results.push({
      name: testCase.name,
      reducedMotion,
      verdict: report.verdict,
      expected: testCase.expect,
      score: report.riskScore,
      htmlLength: html.length,
      missingText: missing,
      anyMissing: Boolean(anyMissing),
      fullMessagePreserved,
      verdictOk,
      error,
    });
  }
}

const failures = results.filter(
  (r) => r.error || r.missingText.length > 0 || r.anyMissing || !r.fullMessagePreserved || !r.verdictOk
);

for (const r of results) {
  const status =
    r.error || r.missingText.length > 0 || r.anyMissing || !r.fullMessagePreserved || !r.verdictOk
      ? 'FAIL'
      : 'PASS';
  const motion = r.reducedMotion ? 'reduced-motion' : 'animated';
  console.log(
    status.padEnd(5),
    '|',
    String(r.verdict).padEnd(10),
    '| score',
    String(r.score).padStart(3),
    '|',
    motion.padEnd(14),
    '|',
    r.name
  );
  if (r.error) console.log('        error:', r.error);
  if (!r.verdictOk) console.log('        expected verdict:', r.expected);
  if (r.missingText.length) console.log('        missing text:', r.missingText.join(' | '));
  if (r.anyMissing) console.log('        none of the accepted variants were present');
  if (!r.fullMessagePreserved) console.log('        full message was NOT preserved');
}

console.log('');
console.log('RESULT:', results.length - failures.length, 'passed,', failures.length, 'failed out of', results.length);
if (failures.length > 0) process.exit(1);
`;

const outfile = path.join(process.cwd(), 'test', '.render-smoke-bundle.mjs');

await build({
  stdin: {
    contents: source,
    resolveDir: process.cwd(),
    sourcefile: 'render-smoke.jsx',
    loader: 'jsx',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  packages: 'external',
  outfile,
  logLevel: 'error',
});

try {
  await import(pathToFileURL(outfile).href);
} finally {
  await unlink(outfile).catch(() => {});
}
