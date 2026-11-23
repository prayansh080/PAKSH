/**
 * False-positive test suite for TRUSTLENS / PAKSH Phase 1 rules engine.
 *
 * Runs against src/lib/rules.js and verifies each test case produces the
 * expected verdict tier.
 *
 * Usage: node test/false-positives.mjs
 */

import { analyzeRules } from '../src/lib/rules.js';
import { FALSE_POSITIVE_TESTS } from '../src/lib/samples.js';

let passed = 0;
let failed = 0;

console.log('═'.repeat(70));
console.log(' FALSE-POSITIVE TEST SUITE — Phase 1 Rules Engine');
console.log('═'.repeat(70));
console.log('');

for (const test of FALSE_POSITIVE_TESTS) {
  const report = analyzeRules(test.text);
  const ok = report.verdict === test.expectedVerdict;

  if (ok) {
    passed++;
    console.log(`✅ PASS | ${test.expectedVerdict.padEnd(12)} | ${test.label}`);
  } else {
    failed++;
    console.log(`❌ FAIL | expected ${test.expectedVerdict.padEnd(12)} | got ${report.verdict.padEnd(12)} | ${test.label}`);
    console.log(`      text: "${test.text}"`);
    console.log(`      signals: ${report.signals.map((s) => `${s.label}(+${s.weight})`).join(', ') || 'none'}`);
    console.log(`      score: ${report.score}`);
    console.log(`      notes: ${test.notes}`);
  }
}

console.log('');
console.log('═'.repeat(70));
console.log(` RESULTS: ${passed} passed, ${failed} failed out of ${FALSE_POSITIVE_TESTS.length}`);
console.log('═'.repeat(70));

process.exit(failed > 0 ? 1 : 0);