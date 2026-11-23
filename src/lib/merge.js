/**
 * Layer 3: Merge rules report with optional AI context.
 *
 * Design principle: the risk score is 100% rules-based and deterministic.
 * AI output is used for context only (category, summary, dna, evidence, actions).
 * AI never overrides or adjusts the rule-based score. This prevents unreliable
 * AI classifications from creating misleading results.
 *
 * If Gemini fails or times out, returns rules-only report in the same shape.
 */

const CATEGORY_RISK = {
  fake_internship: 75,
  kyc_phishing: 80,
  courier_scam: 70,
  scholarship_scam: 70,
  upi_fraud: 85,
  job_scam: 75,
  other: 50,
  safe: 10
};

/**
 * Maps a numeric score to a three-tier verdict.
 * Thresholds are evidence-based:
 *   HIGH RISK   >= 30  (strong evidence)
 *   SUSPICIOUS  >= 20  (moderate evidence)
 *   LOW RISK    < 20   (weak or no evidence — never a guarantee of safety)
 */
function scoreToVerdict(score) {
  if (score >= 30) return 'HIGH RISK';
  if (score >= 20) return 'SUSPICIOUS';
  return 'LOW RISK';
}

function scoreToSeverity(score) {
  if (score >= 30) return 'critical';
  if (score >= 20) return 'high';
  if (score > 0) return 'medium';
  return 'safe';
}

export function mergeReport(rulesReport, aiReport = null) {
  const baseScore = rulesReport.score;

  // Score is 100% rules-based. AI does not adjust it.
  const finalScore = baseScore;
  const verdict = scoreToVerdict(finalScore);
  const severity = scoreToSeverity(finalScore);

  // Confidence: rules-only is high when signals are present; higher when AI corroborates.
  let confidence;
  let aiAdjusted = false;
  let aiReason = '';
  let source = 'rules';

  if (rulesReport.hasSignals) {
    confidence = 75;
  } else {
    confidence = 90;
  }

  if (aiReport && aiReport.category) {
    // AI provides context only — never changes the score.
    aiAdjusted = false;
    source = 'rules + ai context';
    aiReason = `AI category: ${aiReport.category}. ${aiReport.summary || ''}`;

    // If AI confidence is high and rules found nothing, modestly raise confidence.
    if (!rulesReport.hasSignals && aiReport.confidence && aiReport.confidence > 80) {
      confidence = Math.min(100, confidence + 10);
    }
  }

  return {
    riskScore: finalScore,
    verdict,
    severity,
    confidence,
    signals: rulesReport.signals,
    signalCount: rulesReport.signalCount,
    source,
    aiAdjusted,
    aiReason,
    aiReport,
    riskLabel: 'Risk indicator score — not a probability of fraud.'
  };
}