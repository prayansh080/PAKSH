/**
 * Sample chips and demo test cases for PAKSH.
 *
 * Verdict tiers: HIGH RISK | SUSPICIOUS | LOW RISK
 *   HIGH RISK   >= 30  (strong evidence: credential theft, upfront payment, multiple signals)
 *   SUSPICIOUS  >= 20  (moderate evidence: urgency, impersonation, suspicious URL)
 *   LOW RISK    < 20   (weak or no evidence — never a guarantee of safety)
 */

export const SAMPLE_CHIPS = [
  {
    id: 'internship',
    label: 'Fake Internship',
    tone: 'scam',
    text: 'Selected for internship. Pay ₹1,499 today to confirm your position. Contact HR on Telegram.'
  },
  {
    id: 'kyc',
    label: 'KYC Phishing',
    tone: 'scam',
    text: 'Your account will be blocked. Update KYC immediately through this link: http://bit.ly/verify-kyc'
  },
  {
    id: 'otp',
    label: 'OTP Theft',
    tone: 'scam',
    text: 'Share your OTP to verify your bank account or it will be blocked within 24 hours.'
  },
  {
    id: 'courier',
    label: 'Courier/Customs',
    tone: 'scam',
    text: 'Your parcel is stuck at customs. Pay ₹500 clearance fee to release it. Contact on WhatsApp only.'
  },
  {
    id: 'safe',
    label: 'Safe Notice',
    tone: 'safe',
    text: 'Notice: The annual college fest will be held on 12 March in the main campus auditorium. All students are welcome. Details on the notice board.'
  }
];

export const SCAM_SAMPLES = [
  {
    label: 'Fake Internship',
    text: 'Selected for internship. Pay ₹1,499 today to confirm your position. Contact HR on Telegram.',
    expected: 'HIGH RISK'
  },
  {
    label: 'KYC SMS',
    text: 'Your account will be blocked. Update KYC immediately through this link: http://bit.ly/verify-kyc',
    expected: 'HIGH RISK'
  },
  {
    label: 'Courier/Customs',
    text: 'Your parcel is stuck at customs. Pay ₹500 clearance fee to release it. Contact on WhatsApp only.',
    expected: 'HIGH RISK'
  },
  {
    label: 'Scholarship Scam',
    text: 'Congratulations! You won a scholarship. Pay processing fee of ₹2,000 to claim. Email hr@gmail.com now.',
    expected: 'HIGH RISK'
  },
  {
    label: 'UPI Fraud',
    text: 'Someone sent you ₹500 by mistake. Please refund it to this UPI ID immediately or your account will be frozen.',
    expected: 'HIGH RISK'
  },
  {
    label: 'Job Scam',
    text: 'Work from home job. Pay ₹2,000 registration fee to start. WhatsApp only. Limited positions.',
    expected: 'HIGH RISK'
  },
  {
    label: 'OTP Theft',
    text: 'Share your OTP to verify your bank account or it will be blocked within 24 hours.',
    expected: 'HIGH RISK'
  },
  {
    label: 'Urgency Only',
    text: 'Your subscription expires tomorrow. Renew now to continue service.',
    expected: 'LOW RISK'
  }
];

export const SAFE_SAMPLES = [
  {
    label: 'College Event',
    text: 'The annual college fest will be held on 15th December at the main auditorium. All students are invited. Entry is free. Contact the student council for details.',
    expected: 'LOW RISK'
  },
  {
    label: 'Exam Notice',
    text: 'Reminder: Mid-semester exams start from 5th November. Please check the notice board for the schedule. No fees required.',
    expected: 'LOW RISK'
  },
  {
    label: 'Placement Cell',
    text: 'The placement cell has scheduled a campus drive with TCS on 20th November. Register through the official college portal only.',
    expected: 'LOW RISK'
  },
  {
    label: 'Library Update',
    text: 'Library will remain open until 10 PM during exam week. Please return overdue books by Friday.',
    expected: 'LOW RISK'
  },
  {
    label: 'Genuine Fee Reminder',
    text: 'Semester fee payment is due by 30th November. Pay through the official college portal at college.edu.in/fees.',
    expected: 'LOW RISK'
  }
];

/**
 * Structured false-positive test suite.
 * Each case: { label, text, expectedVerdict, notes }
 * Run with: node test/false-positives.mjs
 */
export const FALSE_POSITIVE_TESTS = [
  // Scams that must be caught
  {
    label: 'Fake internship asking registration fee',
    text: 'Selected for internship. Pay ₹1,499 registration fee today. Contact HR on Telegram.',
    expectedVerdict: 'HIGH RISK',
    notes: 'Upfront payment + off-platform contact'
  },
  {
    label: 'KYC message containing suspicious link',
    text: 'Your account will be blocked. Update KYC immediately through http://bit.ly/verify-kyc',
    expectedVerdict: 'HIGH RISK',
    notes: 'Urgency + account threat + shortener URL + impersonation'
  },
  {
    label: 'Fake scholarship asking processing fee',
    text: 'Congratulations! You won a scholarship. Pay processing fee of ₹2,000 to claim.',
    expectedVerdict: 'SUSPICIOUS',
    notes: 'Upfront payment demand alone'
  },
  {
    label: 'UPI refund scam',
    text: 'Someone sent you ₹500 by mistake. Refund it to this UPI ID immediately.',
    expectedVerdict: 'HIGH RISK',
    notes: 'Upfront payment + urgency'
  },
  {
    label: 'OTP theft attempt',
    text: 'Share your OTP to verify your account or it will be blocked.',
    expectedVerdict: 'HIGH RISK',
    notes: 'Credential theft request'
  },

  // Safe messages that must NOT be flagged as scams
  {
    label: 'College fest announcement',
    text: 'The annual college fest will be held on 15th December. Entry is free for all students.',
    expectedVerdict: 'LOW RISK',
    notes: 'Safe context, no scam signals'
  },
  {
    label: 'Exam schedule notice',
    text: 'Mid-semester exams start from 5th November. Check the notice board for schedule.',
    expectedVerdict: 'LOW RISK',
    notes: 'Safe context, no scam signals'
  },
  {
    label: 'Placement cell campus drive',
    text: 'TCS campus drive on 20th November. Register through official college portal.',
    expectedVerdict: 'LOW RISK',
    notes: 'Official college context'
  },
  {
    label: 'Library hours update',
    text: 'Library open until 10 PM during exam week. Return overdue books by Friday.',
    expectedVerdict: 'LOW RISK',
    notes: 'Routine administrative notice'
  },
  {
    label: 'Genuine college fee reminder',
    text: 'Semester fee due by 30th November. Pay through college.edu.in/fees portal.',
    expectedVerdict: 'LOW RISK',
    notes: 'Payment mention inside safe college context — suppressed; official .edu.in domain exempt from HTTPS check'
  },
  {
    label: 'Urgency alone (legitimate)',
    text: 'Your subscription expires tomorrow. Renew now to continue service.',
    expectedVerdict: 'LOW RISK',
    notes: 'Urgency alone (+10) must not be HIGH RISK'
  },
  {
    label: 'Official government notice',
    text: 'Income tax department notice: file your return by 31st July on incometax.gov.in.',
    expectedVerdict: 'LOW RISK',
    notes: 'Official .gov.in domain'
  }
];