import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReducedMotion } from 'framer-motion';
import { BrainCircuit, Menu, ScanSearch, X } from 'lucide-react';

import { BrandMark } from './BrandMark';
import { ThemeToggle } from './ThemeToggle';

/**
 * PageLayout — common wrapper for every page in PAKSH.
 *
 * Provides:
 * - Global header with brand + responsive navigation (desktop bar + mobile menu)
 * - Active route highlighting
 * - Page transition animation
 * - Responsive content container
 * - Breadcrumb / page title
 */
export function PageLayout({ children, title, subtitle, breadcrumb }) {
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const pages = [
    { path: '/', label: 'Home' },
    { path: '/scanner', label: 'Scanner' },
    { path: '/threat-lab', label: 'Threat Lab' },
    { path: '/url-intelligence', label: 'URL Intelligence' },
    { path: '/internship-analyzer', label: 'Internship Analyzer' },
    { path: '/report', label: 'Report' },
    { path: '/history', label: 'Scan History' },
    { path: '/methodology', label: 'Methodology' },
    { path: '/intelligence-graph', label: 'Graph' }
  ];

  const currentPage = pages.find(
    (p) => location.pathname === p.path || location.pathname.startsWith(`${p.path}/`)
  );

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink text-slate-100">
      {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-cyan focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => go('/')}
            className="flex shrink-0 items-center gap-2.5 transition-colors hover:text-cyan"
            aria-label="PAKSH home"
          >
            <BrandMark className="h-8 w-8" />
            <span className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-[0.18em] text-white">PAKSH</span>
              <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.22em] text-faint">
                Deception intelligence
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
            {pages.map((page) => {
              const active = currentPage?.path === page.path;
              return (
                <button
                  key={page.path}
                  type="button"
                  onClick={() => go(page.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] font-medium transition-colors ${
                    active
                      ? 'border border-cyan/25 bg-cyan/10 text-cyan'
                      : 'border border-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  {page.label}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-safe/25 bg-safe/[0.07] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-safe xl:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-safe" />
              Local rules active
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => go('/scanner')}
              className="btn-primary hidden !px-3 !py-2 text-xs sm:inline-flex"
            >
              <ScanSearch className="h-3.5 w-3.5" />
              Scan
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="icon-btn lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {menuOpen ? (
          <div id="mobile-nav" className="border-t border-line bg-ink/95 lg:hidden">
            <nav className="mx-auto grid w-full max-w-7xl gap-1 px-4 py-3 sm:px-6" aria-label="Primary mobile">
              {pages.map((page) => {
                const active = currentPage?.path === page.path;
                return (
                  <button
                    key={page.path}
                    type="button"
                    onClick={() => go(page.path)}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? 'border border-cyan/25 bg-cyan/10 text-cyan'
                        : 'border border-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    {page.label}
                  </button>
                );
              })}
            </nav>
          </div>
        ) : null}
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-6 sm:px-6 sm:pt-8 lg:px-8"
        tabIndex={-1}
      >
        {mounted ? (
          <div
            className={`space-y-8 ${prefersReduced ? 'opacity-100' : 'page-content'}`}
          >
            {title && (
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow text-cyan">{breadcrumb || 'PAKSH'}</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {title}
                  </h1>
                  {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-slate-400">{subtitle}</p>}
                </div>
              </div>
            )}
            {children}
          </div>
        ) : null}
      </main>

      <footer className="mt-auto border-t border-line bg-ink/60">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-7 w-7" />
                <span className="text-sm font-semibold tracking-[0.18em] text-white">PAKSH</span>
              </div>
              <p className="mt-3 max-w-sm text-[11px] leading-relaxed text-faint">
                Digital deception intelligence for suspicious messages, fake internship offers,
                phishing links, and payment scams. Evidence first, always.
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] text-faint">
                <BrainCircuit className="h-3 w-3" />
                Rules engine · optional AI context · optional URL reputation
              </p>
            </div>

            <div>
              <p className="label">Product</p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-400">
                {pages.map((page) => (
                  <li key={page.path}>
                    <button
                      type="button"
                      onClick={() => go(page.path)}
                      className="text-left transition-colors hover:text-white"
                    >
                      {page.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="label">If you were targeted</p>
              <ul className="mt-2 space-y-1.5 text-[11px] text-slate-400">
                <li>
                  <a
                    className="transition-colors hover:text-white"
                    href="https://cybercrime.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    National Cyber Crime Portal
                  </a>
                </li>
                <li>
                  <a className="transition-colors hover:text-white" href="tel:1930">
                    1930 fraud helpline
                  </a>
                </li>
                <li className="text-faint">Contact your bank via its official number.</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-line pt-5 text-[10px] leading-relaxed text-faint sm:flex-row sm:items-center sm:justify-between">
            <p>
              Independent educational tool. Not affiliated with any bank, company, or government body.
              PAKSH does not report, block, or contact anyone on your behalf.
            </p>
            <p className="flex items-center gap-1.5 whitespace-nowrap">
              Local-first · no accounts
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Shared small utility classes used across pages.
 */
export const labelStyles = 'font-mono text-[10px] uppercase tracking-[0.18em] text-muted';
export const eyebrowStyles = 'font-mono text-[10px] uppercase tracking-[0.24em] text-cyan';
