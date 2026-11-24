# PAKSH — 90-Second Hackathon Demo Script

## Overview
**PAKSH** — Digital Deception Intelligence. Tagline: *"See the other side."*

Most tools only say "this message is suspicious." **PAKSH** shows you **the other side** — the evidence, the manipulation tactics, and what to do next.

---

## Setup (10 seconds)

1. **Open** `http://localhost:5173` (or go to the deployed demo).
2. **Observe** the deep navy interface with electric cyan accents.
3. **Tip** for judges: "This is a graduate project built with React, Vite, Tailwind CSS, and Framer Motion. No charts library, no OCR library, no database."

---

## Demo Scenario 1 — Fake Internship (25 seconds)

> **Judge,** let me show you a common internship scam.

1. **Paste** this message into the textarea:
   > `Selected for internship. Pay ₹1,499 today to confirm your position. Contact HR on Telegram.`
2. **Wait** 2–3 seconds for the scan to complete.
3. **Point** to the verdict: **HIGH RISK** (red pulse).
4. **Highlight** the evidence:
   - "₹1,499" → **Payment Trap** (upfront fee demand)
   - "Telegram" → **Off-platform Shift** (HR only on Telegram)
5. **Show** Scam DNA: the two activated stages light up with brief descriptions.
6. **Show** Scam Autopsy: "Upfront payment demand" explains the manipulation; advice: "Do not pay registration fees without independent verification."
7. **Display** the safety action: "Do not pay registration fees, deposits, or processing charges without independent verification."

**Key takeaway:** PAKSH doesn't just say "scam" — it tells you *what kind* and *what to do*.

---

## Demo Scenario 2 — KYC Account Suspension (20 seconds)

1. **Paste** this message:
   > `Your account will be blocked. Update KYC immediately through this link: http://bit.ly/verify-kyc`
2. **Wait** for the scan.
3. **Point** to the verdict: **SUSPICIOUS** (violet/amber pulse).
4. **Highlight** the evidence:
   - "Update KYC" → **Authority impersonation** (message claims to be from a bank/government)
   - "http://bit.ly/verify-kyc" → **Link Trap** (URL shortener + no HTTPS)
   - "immediately" → **Urgency** (time pressure)
5. **Show** Scam DNA: three stages activated.
6. **Show** Scam Autopsy: "Authority impersonation" and "Urgency and pressure" with cautious wording: "The message appears to..." and "This may be an attempt to..."
7. **Safety action:** "Verify the recruiter or organization through independently verified official channels."

---

## Demo Scenario 3 — OTP Theft (15 seconds)

1. **Paste** this message:
   > `Share your OTP to verify your account or it will be blocked.`
2. **Wait** for the scan.
3. **Point** to the verdict: **HIGH RISK** (red).
4. **Highlight** the OTP phrase in cyan.
5. **Show** Scam DNA: **Data Theft** stage only.
6. **Show** Scam Autopsy: "Credential harvesting" — the message appears to request sensitive authentication details.
7. **Safety action:** "Never share OTP, PIN, CVV, or passwords. Legitimate organizations will never ask for these."

---

## Demo Scenario 4 — Safe College Event (10 seconds)

1. **Paste** this message:
   > `The annual college fest will be held on 15th December at the main auditorium. All students are invited. Entry is free. Contact the student council for details.`
2. **Wait** for the scan.
2. **Point** to the verdict: **LOW RISK** (green check).
3. **Point** to the disclaimer: **"Low risk does not guarantee legitimacy. Always verify the sender independently."**
4. **Show** Scam DNA: **no stages activated** — the humble message: "No clear scam sequence detected from the available evidence."
5. **Emphasize:** PAKSH never fabricates threats. Safe messages get a clean result.

---

## If Gemini/Internet Fails (5 seconds)

> **Judge, if the AI service is unavailable:** The app immediately falls back to the rules-only engine. The verdict, score, and signals are still produced — they're 100% deterministic. The source label changes from "AI + Rules" to "Rules only." No fake analysis is ever displayed.

---

## Five Likely Judge Questions (Honest Answers)

| Question | Answer |
|---|---|
| **How accurate is PAKSH?** | The rules engine is deterministic and tested against 12 false-positive cases — zero safe messages are incorrectly flagged. AI output varies; the risk score is always rules-based and never overridden by AI. |
| **Can I rely on it for real safety?** | PAKSH is an **indicator**, not a guarantee. The label reads: "Risk indicator score — not a probability of fraud." Low risk does not guarantee legitimacy. Always verify senders independently. |
| **How does Scam DNA work?** | It maps detected signals to known scam stages (e.g., OTP request → Data Theft). Only stages with actual evidence are activated. No stage is shown without supporting evidence from the message. |
| **Does PAKSH store my messages?** | No. "Messages are not stored. History stays on your device." The app uses localStorage only for scan history (last 5 scans), and no API key is ever sent to the frontend. |
| **What makes PAKSH different from other scam detectors?** | Most tools give a yes/no verdict. PAKSH shows **the other side**: the exact evidence, the manipulation pattern, and specific safety actions — all explained with cautious, ground wording. |

---

## Final Checklist

- [x] Production build succeeds (`npm run build`)
- [x] 12 false-positive tests pass (zero fabrications on safe messages)
- [x] 6 demo cases pass (scam + safe verification)
- [x] Mobile layout works at 390px width
- [x] Reduced-motion behavior respected
- [x] No API key in frontend code
- [x] Rules-only fallback works when Gemini is unavailable
- [x] AI never modifies the risk score or verdict
- [x] All 8 Phase 2+3 components render correctly
- [x] End-to-end user journey: input → verdict → evidence → Scam DNA → Autopsy → safety actions

---
*PAKSH — See the other side.*