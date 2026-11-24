/**
 * Plain-text export of a rules report.
 *
 * The export mirrors exactly what the UI shows: deterministic score, detected
 * signals with their evidence and fixed weight, the verdict, and the actions.
 * Nothing is added that was not computed by the rules engine.
 */
import { getActiveStages, getSignalMeta } from './signals';

export function reportToText(report, message = '') {
  if (!report) return '';

  const lines = [];
  const generated = report.analyzedAt ? new Date(report.analyzedAt) : new Date();

  lines.push('PAKSH — Intelligence Report');
  lines.push('='.repeat(40));
  lines.push(`Verdict:        ${report.verdict}`);
  lines.push(`Risk indicator: ${report.riskScore}/100`);
  lines.push(`Rule confidence:${' '}${report.confidence}%`);
  lines.push(`Score source:   ${report.source}`);
  lines.push(`AI adjusted:    ${report.aiAdjusted ? 'yes' : 'no'}`);
  lines.push(`Generated:      ${generated.toLocaleString()}`);
  lines.push('');
  lines.push('NOTE');
  lines.push(report.riskLabel || 'Risk indicator score — not a probability of fraud.');
  lines.push('PAKSH does not verify sender identity, message history, or link destinations.');
  lines.push('');

  const signals = Array.isArray(report.signals) ? report.signals : [];
  lines.push(`DETECTED SIGNALS (${signals.length})`);
  lines.push('-'.repeat(40));
  if (signals.length === 0) {
    lines.push('No rule signals fired. Absence of signals is not proof of safety.');
  } else {
    signals.forEach((signal) => {
      const meta = getSignalMeta(signal.id);
      lines.push(`• ${meta.label} (+${signal.weight ?? meta.weight})`);
      lines.push(`  Evidence: ${signal.evidence || 'n/a'}`);
      lines.push(`  Why it matters: ${meta.why}`);
      lines.push(`  Action: ${meta.action}`);
      lines.push('');
    });
  }

  const stages = getActiveStages(signals);
  lines.push('');
  lines.push(`SCAM PATTERN STAGES (${stages.length})`);
  lines.push('-'.repeat(40));
  if (stages.length === 0) {
    lines.push('No scam-pattern stage was supported by the detected signals.');
  } else {
    stages.forEach((stage) => lines.push(`• ${stage.label} — ${stage.description}`));
  }

  lines.push('');
  lines.push('AI CONTEXT');
  lines.push('-'.repeat(40));
  lines.push(report.aiAvailable ? report.aiReason || 'AI context was available.' : report.aiNote || 'Rules-only analysis.');
  lines.push('AI context never changes the score or verdict.');
  lines.push('');

  lines.push('MESSAGE ANALYSED');
  lines.push('-'.repeat(40));
  lines.push(message || report.originalMessage || '(not stored)');

  return lines.join('\n');
}

export function downloadReport(report, message = '') {
  const text = reportToText(report, message);
  if (!text) return false;

  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `paksh-report-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
