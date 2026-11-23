/**
 * Layer 3: Merge rules report with optional AI report.
 * Final risk = rules score, optionally adjusted by AI (clamped).
 * If Gemini fails/times out, returns rules-only report in same shape.
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

export function mergeReport(rulesReport, aiReport = null) {
  const baseScore = rulesReport.score;
  let finalScore = baseScore;
  let aiAdjusted = false;
  let aiReason = '';
  let source = 'rules';

  if (aiReport && aiReport.category) {
    const aiRisk = CATEGORY_RISK[aiReport.category] ?? 50;
    const aiConfidence = aiReport.confidence ?? 50;
    // AI can nudge score by up to 30 points, weighted by its confidence
    const aiWeight = Math.min(30, (aiConfidence / 100) * 30);
    finalScore = Math.min(
      100,
      Math.max(0, Math.round(baseScore * 0.7 + aiRisk * 0.3 + aiWeight * 0.1))
    );
    aiAdjusted = true;
    aiReason = `AI context (${aiReport.category}): ${aiReport.summary || ''}`;
    source = 'ai-merged';
  }

  let severity = 'safe';
  if (finalScore >= 60) severity = 'critical';
  else if (finalScore >= 40) severity = 'high';
  else if (finalScore >= 20) severity = 'medium';

  const confidence = aiReport && aiReport.confidence !== undefined
    ? Math.min(100, Math.max(40, aiReport.confidence))
    : rulesReport.hasSignals
      ? 75
      : 90;

  return {
    riskScore: finalScore,
    confidence,
    severity,
    verdict: finalScore >= 40 ? 'SCAM' : 'SAFE',
    signals: rulesReport.signals,
    signalCount: rulesReport.signalCount,
    source,
    aiAdjusted,
    aiReason,
    aiReport
  };
}