import {
  AlertTriangle,
  CheckCircle2,
  Globe2,
  Info,
  Link2,
  Loader2,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { REPUTATION_STATE } from '../lib/reputation';

const PROVIDER_LABEL = {
  'google-safe-browsing': 'Google Safe Browsing'
};

const THREAT_LABEL = {
  MALWARE: 'Malware',
  SOCIAL_ENGINEERING: 'Phishing / social engineering',
  UNWANTED_SOFTWARE: 'Unwanted software',
  POTENTIALLY_HARMFUL_APPLICATION: 'Potentially harmful application',
  UNKNOWN: 'Unknown threat type'
};

const RISK_CHIP = {
  high: 'border-danger/25 bg-danger/10 text-danger',
  medium: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
  low: 'border-safe/25 bg-safe/10 text-safe'
};

/**
 * ThreatIntel — local URL breakdown plus optional external reputation.
 *
 * External results are corroboration only. They never change the deterministic
 * rules score. When the provider is not configured, the panel says so plainly.
 */
export function ThreatIntel({ urls = [], urlDetails = [], reputation }) {
  const status = reputation?.status || REPUTATION_STATE.IDLE;
  const provider = PROVIDER_LABEL[reputation?.provider] || 'External provider';
  const hasUrls = urls.length > 0;
  const matches = Array.isArray(reputation?.matches) ? reputation.matches : [];

  return (
    <section aria-labelledby="intel-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="intel-heading" className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-electric">Intel</span>
            Link and threat intelligence
          </h3>
          <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-faint">
            Local URL structure is always checked. External reputation is optional and never changes the score.
          </p>
        </div>
        <span className="chip">
          <Globe2 className="h-3 w-3" />
          {hasUrls ? `${urls.length} link${urls.length === 1 ? '' : 's'}` : 'No links'}
        </span>
      </div>

      {!hasUrls ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-4">
          <Link2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-faint" />
          <div>
            <p className="text-sm text-slate-300">No links found in this message.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-faint">
              URL reputation is not needed. The rules engine still evaluated the message text.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="label">Local URL breakdown</p>
            {urlDetails.map((detail, index) => (
              <div key={`${detail.url}-${index}`} className="rounded-xl border border-line bg-white/[0.02] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-all font-mono text-[11px] leading-relaxed text-slate-300">
                    {detail.url}
                  </p>
                  <span
                    className={`flex-shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] ${RISK_CHIP[detail.riskLevel] || RISK_CHIP.low}`}
                  >
                    {detail.riskLevel}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-faint">
                  {detail.domain} · {detail.https ? 'HTTPS' : 'No HTTPS'}
                  {detail.isOfficial ? ' · official suffix' : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {detail.flags.length > 0 ? (
                    detail.flags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded border border-line bg-ink/50 px-1.5 py-0.5 text-[9px] text-slate-400"
                      >
                        {flag}
                      </span>
                    ))
                  ) : (
                    <span className="rounded border border-safe/20 bg-safe/5 px-1.5 py-0.5 text-[9px] text-safe/80">
                      No local URL flags
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="label">External reputation</p>
            <div className="mt-2 rounded-xl border border-line bg-white/[0.02] p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-slate-200">{provider}</p>
                <StatusChip status={status} matches={matches.length} />
              </div>

              {status === REPUTATION_STATE.LOADING ? (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan" />
                  Checking the provider…
                </div>
              ) : null}

              {status === REPUTATION_STATE.NOT_CONFIGURED ? (
                <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                  <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                  <span>
                    Not configured. Add <code className="rounded bg-ink px-1 py-0.5 font-mono text-[10px] text-slate-300">GOOGLE_SAFE_BROWSING_API_KEY</code> on
                    the server to enable real lookups. Local URL signals above still apply.
                  </span>
                </div>
              ) : null}

              {status === REPUTATION_STATE.UNAVAILABLE ? (
                <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                  <span>{reputation?.error || 'External check unavailable.'} Local URL signals above still apply.</span>
                </div>
              ) : null}

              {status === REPUTATION_STATE.OK && matches.length === 0 ? (
                <div className="mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-safe" />
                  <span>
                    No known threat matches returned. Not being listed is not proof of safety.
                  </span>
                </div>
              ) : null}

              {status === REPUTATION_STATE.OK && matches.length > 0 ? (
                <div className="mt-3">
                  <div className="flex items-start gap-2 text-[11px] leading-relaxed text-danger">
                    <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>One or more URLs matched a known threat list.</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {matches.map((match, index) => (
                      <li
                        key={`${match.url}-${index}`}
                        className="rounded-lg border border-danger/20 bg-danger/5 px-2 py-1.5 text-[10px] text-slate-300"
                      >
                        <span className="font-medium text-danger">
                          {THREAT_LABEL[match.threatType] || match.threatType}
                        </span>
                        <span className="ml-1 break-all font-mono text-[9px] text-faint">{match.url}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <p className="mt-3 border-t border-line pt-2 text-[10px] leading-relaxed text-faint">
                External results are corroboration only. They never change the deterministic risk indicator score.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatusChip({ status, matches }) {
  if (status === REPUTATION_STATE.LOADING) {
    return <span className="chip text-cyan">Checking</span>;
  }
  if (status === REPUTATION_STATE.OK && matches > 0) {
    return <span className="rounded-full border border-danger/25 bg-danger/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-danger">Listed</span>;
  }
  if (status === REPUTATION_STATE.OK) {
    return <span className="rounded-full border border-safe/25 bg-safe/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-safe">No match</span>;
  }
  if (status === REPUTATION_STATE.NOT_CONFIGURED) {
    return <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-amber-400">Not configured</span>;
  }
  if (status === REPUTATION_STATE.UNAVAILABLE) {
    return <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-amber-400">Unavailable</span>;
  }
  return <span className="chip">Idle</span>;
}
