import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, Fingerprint, ShieldCheck } from 'lucide-react';

import { useTheme, readAccent } from '../lib/theme';

/**
 * Intro — the cinematic opening sequence.
 *
 * Timeline (full page load only):
 *   0.0s  mark scales in
 *   0.8s  headline + tagline reveal
 *   1.7s  signal sphere fades in
 *   2.9s  status lines + "Enter PAKSH" become available
 *   5.0s  the sequence completes on its own
 *   5.6s  fade finished, site takes over
 *
 * The sequence is timer-driven, so a fast load can never cut it short, and it
 * is mounted by App once per page load, so internal route changes never replay
 * it. Skip is always available and never triggered automatically.
 *
 * Reduced motion gets a deliberate static version that still auto-continues
 * (after 2.6s) and offers an explicit Continue button — never a blank screen
 * or an endless loader.
 */

const TIMELINE = {
  title: 800,
  sphere: 1700,
  ready: 2900,
  autoExit: 5000,
  fade: 560
};

const STATUS_LINES = [
  'Loading deterministic rules engine',
  '6 scam pattern classes mapped',
  'Evidence highlighting ready'
];

export function Intro({ onComplete }) {
  const prefersReduced = Boolean(useReducedMotion());
  const { theme } = useTheme();

  const [phase, setPhase] = useState(() => (prefersReduced ? 'ready' : 'mark'));
  const [leaving, setLeaving] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);

  const onCompleteRef = useRef(onComplete);
  const doneRef = useRef(false);
  const fadeTimerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  /** End the sequence exactly once, after the fade-out has actually run. */
  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setLeaving(true);
    fadeTimerRef.current = window.setTimeout(() => {
      if (onCompleteRef.current) onCompleteRef.current();
    }, TIMELINE.fade);
  }, []);

  // Timeline. Self-driving timers, so a stage change can never restart or stall
  // the sequence, and the intro is never skipped just because the page loaded.
  useEffect(() => {
    const timers = [];

    if (prefersReduced) {
      const exit = window.setTimeout(finish, 2600);
      timers.push(exit);
      return () => timers.forEach((id) => window.clearTimeout(id));
    }

    timers.push(window.setTimeout(() => setPhase('title'), TIMELINE.title));
    timers.push(window.setTimeout(() => setPhase('sphere'), TIMELINE.sphere));
    timers.push(window.setTimeout(() => setPhase('ready'), TIMELINE.ready));
    timers.push(window.setTimeout(finish, TIMELINE.autoExit));

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [finish, prefersReduced]);

  // Cycle the status lines while the sequence runs (real product facts only).
  useEffect(() => {
    if (prefersReduced) return undefined;
    const id = window.setInterval(
      () => setStatusIndex((index) => (index + 1) % STATUS_LINES.length),
      900
    );
    return () => window.clearInterval(id);
  }, [prefersReduced]);

  // Keep the page behind the intro from scrolling while it plays.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
    };
  }, []);

  // Escape skips, like the visible button.
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [finish]);

  // Theme-aware signal sphere. Draws a single frame when motion is reduced.
  useEffect(() => {
    if (phase === 'mark' || phase === 'title') return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const accents = {
      cyan: readAccent('--a-cyan', '#22d3ee'),
      blue: readAccent('--a-electric', '#3b82f6'),
      violet: readAccent('--a-violet', '#8b5cf6'),
      danger: readAccent('--a-danger', '#f43f5e'),
      grid: readAccent('--a-muted', '#94a3b8')
    };

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let angle = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const nodes = Array.from({ length: 48 }, (_, i) => {
      const t = i / 47;
      const y = 1 - t * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = i * 2.399963229728653;
      return {
        x: Math.cos(theta) * r,
        y,
        z: Math.sin(theta) * r,
        phase: i * 0.6
      };
    });

    const edges = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        if (dx * dx + dy * dy + dz * dz < 0.22) edges.push([i, j]);
      }
    }

    const draw = (now) => {
      if (!prefersReduced) angle += 0.0022;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tilt = -0.32;
      const cosT = Math.cos(tilt);
      const sinT = Math.sin(tilt);

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const R = Math.min(width, height) * 0.4;

      const glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.5);
      glow.addColorStop(0, 'rgba(34, 211, 238, 0.16)');
      glow.addColorStop(0.6, 'rgba(59, 130, 246, 0.05)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const project = (p) => {
        const x = p.x * cos - p.z * sin;
        const z = p.x * sin + p.z * cos;
        const y = p.y * cosT - z * sinT;
        const zz = p.y * sinT + z * cosT;
        const scale = 1 / (1.9 - zz * 0.5);
        return { x: cx + x * R * scale, y: cy + y * R * scale, z: zz, scale };
      };

      const projected = nodes.map(project);

      for (const [i, j] of edges) {
        const a = projected[i];
        const b = projected[j];
        const depth = (a.z + b.z) / 2;
        if (depth < -0.3) continue;
        const alpha = 0.05 + ((depth + 1) / 2) * 0.22;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = accents.blue;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (let i = 0; i < nodes.length; i += 1) {
        const p = projected[i];
        const depth = (nodes[i].z + 1) / 2;
        const pulse = 0.5 + 0.5 * Math.sin(now * 0.003 + nodes[i].phase);
        const tone = i % 11 === 0 ? accents.violet : i % 17 === 0 ? accents.danger : accents.cyan;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6 + depth * 2.2 + pulse * 1.1, 0, Math.PI * 2);
        ctx.fillStyle = tone;
        ctx.globalAlpha = 0.25 + depth * 0.55 + pulse * 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (!prefersReduced) frame = requestAnimationFrame(draw);
    };

    if (prefersReduced) draw(0);
    else frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [phase, prefersReduced, theme]);

  const showTitle = phase !== 'mark';
  const showSphere = phase === 'sphere' || phase === 'ready';
  const isReady = phase === 'ready';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PAKSH opening sequence"
      className={`fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-ink transition-opacity ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${TIMELINE.fade}ms` }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 grid-overlay opacity-70" aria-hidden="true" />
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgb(var(--c-cyan) / 0.10) 0%, transparent 62%)'
        }}
      />

      {!prefersReduced ? (
        <button
          type="button"
          onClick={finish}
          className="absolute right-4 top-4 z-20 rounded-lg border border-line bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-cyan/40 hover:text-white sm:right-6 sm:top-6"
        >
          Skip intro
        </button>
      ) : null}

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center px-6 text-center">
        {/* Mark */}
        <div
          className="relative mb-6 flex h-20 w-20 items-center justify-center"
          style={{
            animation: prefersReduced ? 'none' : 'mark-breathe 3.4s ease-in-out infinite'
          }}
        >
          <svg viewBox="0 0 64 64" fill="none" className="h-full w-full" aria-hidden="true">
            <defs>
              <linearGradient id="intro-brand" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
                <stop stopColor="var(--a-cyan)" />
                <stop offset="0.55" stopColor="var(--a-electric)" />
                <stop offset="1" stopColor="var(--a-violet)" />
              </linearGradient>
            </defs>
            <rect width="64" height="64" rx="16" fill="rgb(var(--c-navy))" />
            <rect x="1" y="1" width="62" height="62" rx="15" stroke="url(#intro-brand)" strokeOpacity="0.5" />
            <path
              d="M32 12 50 19v13c0 10.4-7.2 17.6-18 21-10.8-3.4-18-10.6-18-21V19l18-7Z"
              stroke="url(#intro-brand)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <path
              d="M20 32c3.4-5.2 7.4-7.8 12-7.8S40.6 26.8 44 32c-3.4 5.2-7.4 7.8-12 7.8S23.4 37.2 20 32Z"
              stroke="url(#intro-brand)"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="32" r="3.4" fill="url(#intro-brand)" />
          </svg>
        </div>

        {/* Headline */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: showTitle ? 1 : 0,
            transform: showTitle ? 'none' : 'translateY(8px)'
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan">PAKSH</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            See the <span className="text-gradient">other side.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">Digital deception intelligence</p>
        </div>

        {/* Sphere */}
        <div
          className="relative mt-6 flex h-[240px] w-full items-center justify-center transition-all duration-700 sm:h-[280px]"
          style={{
            opacity: showSphere ? 1 : 0,
            transform: showSphere ? 'none' : 'scale(0.96)'
          }}
          aria-hidden="true"
        >
          <canvas ref={canvasRef} className="h-full w-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 pb-2">
            <div className="flex items-center gap-2 rounded-full border border-cyan/25 bg-cyan/[0.06] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-soft" />
              Local rules engine ready
            </div>
            <p className="h-4 font-mono text-[10px] text-faint" aria-live="polite">
              {prefersReduced ? 'Reduced motion — static preview' : STATUS_LINES[statusIndex]}
            </p>
          </div>
        </div>

        {/* Entry */}
        <div
          className="mt-2 flex flex-col items-center gap-3 transition-all duration-500"
          style={{ opacity: isReady ? 1 : 0, transform: isReady ? 'none' : 'translateY(6px)' }}
        >
          <button
            type="button"
            onClick={finish}
            className="btn-primary"
            tabIndex={isReady ? 0 : -1}
            aria-hidden={isReady ? undefined : 'true'}
          >
            {prefersReduced ? 'Continue to PAKSH' : 'Enter PAKSH'}
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="flex items-center gap-3 text-[10px] text-faint">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Local-first
            </span>
            <span className="inline-flex items-center gap-1">
              <Fingerprint className="h-3 w-3" /> No account
            </span>
          </p>
        </div>
      </div>

      {/* Progress rail — reflects the real remaining duration */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.06]" aria-hidden="true">
        <div
          className="h-full origin-left bg-gradient-to-r from-cyan via-electric to-violet"
          style={{
            animation: prefersReduced ? 'none' : `intro-progress ${TIMELINE.autoExit}ms linear forwards`,
            transform: prefersReduced ? 'scaleX(1)' : undefined
          }}
        />
      </div>
    </div>
  );
}
