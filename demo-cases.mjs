import { analyzeRules } from './src/lib/rules.js';

const tests = [
  { name: 'Scam 1: Internship + payment + urgency + off-platform', text: 'Selected for internship. Pay 1499 today to confirm your position. Contact HR on Telegram.' },
  { name: 'Scam 2: Account blocked KYC link', text: 'Your account will be blocked. Update KYC immediately through this link.' },
  { name: 'Safe: College event announcement', text: 'The annual college fest will be held on 15th December at the main auditorium.' },
  { name: 'Safe: Urgency alone (legitimate)', text: 'Your subscription expires tomorrow. Renew now to continue service.' },
  { name: 'OTP theft', text: 'Share your OTP to verify your account or it will be blocked.' },
  { name: 'Genuine fee reminder with college domain', text: 'Semester fee due by 30th November. Pay through college.edu.in/fees portal.' }
];

let allPass = true;
for (const t of tests) {
  const r = analyzeRules(t.text);
  // Expected verdicts based on thresholds:
  // HIGH RISK >= 30, SUSPICIOUS >= 20, LOW RISK < 20
  const expected = t.name.includes('Scam 1') || t.name.includes('OTP theft') ? 'HIGH RISK'
    : t.name.includes('Scam 2') ? 'SUSPICIOUS'  // KYC: impersonation(15) + urgency(10) = 25
    : 'LOW RISK';
  const ok = r.verdict === expected;
  if (!ok) allPass = false;
  console.log(`${r.verdict.padEnd(13)} | score: ${r.score} | ${ok ? '✅' : '❌'} ${t.name}`);
}

console.log('');
console.log(allPass ? 'All demo cases passed!' : 'Some cases failed!');
process.exit(allPass ? 0 : 1);