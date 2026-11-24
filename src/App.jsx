import { useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Intro } from './components/Intro';
import Home from './components/pages/Home';
import ScannerPage from './components/pages/ScannerPage';
import ThreatLab from './components/pages/ThreatLab';
import URLIntelligence from './components/pages/URLIntelligence';
import InternshipAnalyzer from './components/pages/InternshipAnalyzer';
import ScanHistory from './components/pages/ScanHistory';
import Methodology from './components/pages/Methodology';
import IntelligenceGraph from './components/pages/IntelligenceGraph';
import Report from './components/pages/Report';

/**
 * App — route shell.
 *
 * The cinematic intro plays on a full page load (opening the site or a
 * refresh) and never on client-side route changes, because App mounts once per
 * load. It runs for its full timeline, then hands control back. A deep link is
 * preserved: the intro never redirects the visitor to Home.
 */
export default function App() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const route = location.pathname;

  return (
    <div className="min-h-screen">
      {showIntro ? <Intro onComplete={handleIntroComplete} /> : null}

      {route === '/' ? (
        <Home />
      ) : route === '/scanner' ? (
        <ScannerPage />
      ) : route === '/threat-lab' ? (
        <ThreatLab />
      ) : route === '/url-intelligence' ? (
        <URLIntelligence />
      ) : route === '/internship-analyzer' ? (
        <InternshipAnalyzer />
      ) : route === '/report' ? (
        <Report />
      ) : route === '/history' ? (
        <ScanHistory />
      ) : route === '/methodology' ? (
        <Methodology />
      ) : route === '/intelligence-graph' ? (
        <IntelligenceGraph />
      ) : (
        <Navigate to="/" replace />
      )}
    </div>
  );
}
