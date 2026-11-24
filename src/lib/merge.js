/**
 * Layer 3: Merge rules report with optional AI context.
 *
 * Design principle: the risk score is 100% rules-based and deterministic.
 * AI output is used for context only (category, summary, dna, evidence, actions).
 * AI never overrides or adjusts the rule-based score.
 *
 * AI availability is explicit: the server sets `available: false` when no key
 * is configured or the provider fails. The UI must never label a fallback as
 * "AI context".
 *
 * If Gemini fails or times out, returns a rules-only report in the same shape.
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

function aiAvailability(aiReport) {
  if (!aiReport || typeof aiReport !== 'object') {
    return { available: false, reason: 'not_called' };
  }
  if (aiReport.available === false) {
    return { available: false, reason: aiReport.reason || 'unavailable' };
  }
  if (typeof aiReport.category !== 'string') {
    return { available: false, reason: 'invalid_response' };
  }
  return { available: true, reason: null };
}

function emptyReport(messageText) {
  return {
    riskScore: 0,
    verdict: 'LOW RISK',
    severity: 'safe',
    confidence: 90,
    signals: [],
    signalCount: 0,
    source: 'rules',
    aiAdjusted: false,
    aiAvailable: false,
    aiReason: '',
    aiCategory: null,
    aiNote: 'No analysable message content.',
    aiReport: null,
    riskLabel: 'Risk indicator score — not a probability of fraud.',
    originalMessage: messageText || '',
    analyzedAt: new Date().toISOString()
  };
}

export function mergeReport(rulesReport, aiReport = null, messageText = '') {
  if (!rulesReport || typeof rulesReport.score !== 'number') {
    return emptyReport(messageText);
  }

  const finalScore = rulesReport.score;
  const verdict = scoreToVerdict(finalScore);
  const severity = scoreToSeverity(finalScore);
  const confidence = rulesReport.hasSignals ? 75 : 90;
  const availability = aiAvailability(aiReport);
  const source = availability.available ? 'rules + ai context' : 'rules';

  const aiNote = availability.available
    ? ''
    : availability.reason === 'not_configured'
      ? 'AI context is not configured on the server. Rules-only analysis used.'
      : availability.reason === 'timeout'
        ? 'AI context timed out. Rules-only analysis used.'
        : availability.reason === 'not_called'
          ? 'AI context was not requested. Rules-only analysis used.'
          : 'AI context was unavailable. Rules-only analysis used.';

  return {
    riskScore: finalScore,
    verdict,
    severity,
    confidence,
    signals: Array.isArray(rulesReport.signals) ? rulesReport.signals : [],
    signalCount: rulesReport.signalCount || (rulesReport.signals || []).length,
    source,
    aiAdjusted: false,
    aiAvailable: availability.available,
    aiReason: availability.available ? aiReport.summary || '' : '',
    aiCategory: availability.available ? aiReport.category : null,
    aiNote,
    aiReport: availability.available ? aiReport : null,
    riskLabel: 'Risk indicator score — not a probability of fraud.',
    originalMessage: typeof messageText === 'string' ? messageText : '',
    analyzedAt: new Date().toISOString()
  };
}
