/**
 * Sample chips and demo test cases for TRUSTLENS.
 */

export const SAMPLE_CHIPS = [
  {
    id: 'internship',
    label: 'Fake Internship',
    text: 'Selected for internship. Pay ₹1,499 today to confirm your position. Contact HR on Telegram.'
  },
  {
    id: 'kyc',
    label: 'KYC SMS',
    text: 'Your account will be blocked. Update KYC immediately through this link: http://bit.ly/verify-kyc'
  },
  {
    id: 'courier',
    label: 'Courier/Customs',
    text: 'Your parcel is stuck at customs. Pay ₹500 clearance fee to release it. Contact on WhatsApp only.'
  },
  {
    id: 'scholarship',
    label: 'Scholarship',
    text: 'Congratulations! You won a scholarship. Pay processing fee of ₹2,000 to claim. Email hr@gmail.com now.'
  }
];

export const SCAM_SAMPLES = [
  {
    label: 'Fake Internship',
    text: 'Selected for internship. Pay ₹1,499 today to confirm your position. Contact HR on Telegram.',
    expected: 'high'
  },
  {
    label: 'KYC SMS',
    text: 'Your account will be blocked. Update KYC immediately through this link: http://bit.ly/verify-kyc',
    expected: 'high'
  },
  {
    label: 'Courier/Customs',
    text: 'Your parcel is stuck at customs. Pay ₹500 clearance fee to release it. Contact on WhatsApp only.',
    expected: 'high'
  },
  {
    label: 'Scholarship Scam',
    text: 'Congratulations! You won a scholarship. Pay processing fee of ₹2,000 to claim. Email hr@gmail.com now.',
    expected: 'high'
  },
  {
    label: 'UPI Fraud',
    text: 'Someone sent you ₹500 by mistake. Please refund it to this UPI ID immediately or your account will be frozen.',
    expected: 'high'
  },
  {
    label: 'Job Scam',
    text: 'Work from home job. Pay ₹2,000 registration fee to start. WhatsApp only. Limited positions.',
    expected: 'high'
  }
];

export const SAFE_SAMPLES = [
  {
    label: 'College Event',
    text: 'The annual college fest will be held on 15th December at the main auditorium. All students are invited. Entry is free. Contact the student council for details.',
    expected: 'safe'
  },
  {
    label: 'Exam Notice',
    text: 'Reminder: Mid-semester exams start from 5th November. Please check the notice board for the schedule. No fees required.',
    expected: 'safe'
  },
  {
    label: 'Placement Cell',
    text: 'The placement cell has scheduled a campus drive with TCS on 20th November. Register through the official college portal only.',
    expected: 'safe'
  },
  {
    label: 'Library Update',
    text: 'Library will remain open until 10 PM during exam week. Please return overdue books by Friday.',
    expected: 'safe'
  }
];