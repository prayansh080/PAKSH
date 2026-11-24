import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { Download, FileText, Network } from 'lucide-react';

import { PageLayout } from '../PageLayout';
import { ReportLayout } from '../ReportLayout';
import { ErrorBoundary } from '../ErrorBoundary';
import { downloadReport } from '../../lib/exportReport';

const LAST_REPORT_KEY = 'paksh-last-report';

/**
 * Report — full-page view of the most recent investigation.
 * The scanner writes the newest report to session storage; this route renders it.
 */
export default function Report() {
  const prefersReduced = useReducedMotion();
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_REPORT_KEY);
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, []);

  const report = payload?.report;

  return (
    <PageLayout
      title="Intelligence Report"
      subtitle="The most recent investigation rendered in full. Reports are stored only in this browser session."
      breadcrumb="Report"
    >
      {report ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to="/intelligence-graph" className="btn-ghost text-xs !px-3 !py-2">
              <Network className="h-3.5 w-3.5" />
              View evidence graph
            </Link>
            <button
              type="button"
              onClick={() => downloadReport(report, payload.message || '')}
              className="btn-ghost text-xs !px-3 !py-2"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
            <Link to="/scanner" className="btn-primary text-xs !px-3 !py-2">
              New investigation
            </Link>
          </div>
          <ErrorBoundary>
          <ReportLayout
            report={report}
            message={payload.message || ''}
            reducedMotion={prefersReduced}
            reputation={payload.reputation || null}
            urlDetails={payload.urlDetails || []}
          />
          </ErrorBoundary>
        </div>
      ) : (
        <div className="panel flex flex-col items-center px-6 py-16 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-white/[0.02] text-faint">
            <FileText className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold text-white">No report yet</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Run an investigation in the scanner and the full report will appear here.
          </p>
          <Link to="/scanner" className="btn-primary mt-6">
            Open the scanner
          </Link>
        </div>
      )}
    </PageLayout>
  );
}
