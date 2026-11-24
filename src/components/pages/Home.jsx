import { useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BrainCircuit,
  Fingerprint,
  Globe2,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

import { PageLayout } from '../PageLayout';
import SignalSphere from '../SignalSphere';
import { Reveal } from '../Reveal';

/**
 * Home — landing page.
 *
 * Motion is layered on top of static content: the hero copy staggers in, the
 * signal sphere rotates, sections reveal on scroll, and every effect is
 * disabled under prefers-reduced-motion (handled by Reveal and index.css).
 */
export default function Home() {
  const prefersReduced = Boolean(useReducedMotion());
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const features = [
    {
      id: 'rules',
      title: 'Deterministic rules engine',
      icon: BrainCircuit,
      body: 'Fixed weights for six scam patterns. Same message always produces the same score — no randomness, no black box.'
    },
    {
      id: 'evidence',
      title: 'Exact evidence highlighting',
      icon: Fingerprint,
      body: 'Only phrases that actually triggered a rule are highlighted inside your original message. Nothing is invented.'
    },
    {
      id: 'pattern',
      title: 'ScamDNA pattern map',
      icon: Globe2,
      body: 'Detected signals map to six scam pattern stages so the shape of the deception becomes visible.'
    },
    {
      id: 'verdict',
      title: 'Transparent verdict',
      icon: ShieldCheck,
      body: 'AI context and URL reputation are shown separately. They never change the deterministic risk score.'
    },
    {
      id: 'privacy',
      title: 'Local-first privacy',
      icon: Sparkles,
      body: 'Rules analysis runs in your browser. No account required. Nothing is stored on a server.'
    }
  ];

  return (
    <PageLayout
      title="Digital Deception Intelligence"
      subtitle="See the other side of suspicious messages, fake internship offers, phishing links, and payment scams."
      breadcrumb="Home"
    >
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-cyan/[0.04] blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -inset-8 -z-10 -translate-x-1/4 rounded-3xl bg-violet/[0.03] blur-[100px]"
          aria-hidden="true"
        />

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
          <div>
            <div className="hero-line hero-line-1 flex flex-wrap items-center gap-2">
              <span className="chip-cyan">
                <Fingerprint className="h-3 w-3" />
                Digital deception intelligence
              </span>
              <span className="chip">Built for Indian students</span>
            </div>

            <h1 className="hero-line hero-line-2 mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              See the <span className="text-gradient">other side.</span>
            </h1>

            <p className="hero-line hero-line-3 mt-4 max-w-xl text-slate-400 sm:text-lg leading-relaxed">
              Paste a suspicious message or URL. PAKSH extracts the signals, scores the risk with a
              deterministic rules engine, highlights the exact evidence, maps the scam pattern, and
              tells you what to do next.
            </p>

            <div className="hero-line hero-line-4 mt-8 flex flex-wrap items-center gap-3">
              <Link to="/scanner" className="btn-primary group">
                <ScanSearch className="h-4 w-4" />
                Investigate a message
                <ArrowRight className="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
              <Link to="/threat-lab" className="btn-ghost">
                Explore Threat Lab
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="hero-line hero-line-5 mt-10 grid max-w-lg grid-cols-3 gap-3">
              {[
                { label: 'Rule signals', value: '6' },
                { label: 'Intelligence layers', value: '3' },
                { label: 'Sign-up required', value: '0' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-line bg-white/[0.02] px-3 py-3 transition-colors hover:border-cyan/30"
                >
                  <dt className="label">{stat.label}</dt>
                  <dd className="mt-1 text-lg font-semibold text-white tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </div>

            <p className="hero-line hero-line-5 mt-6 flex items-center gap-1.5 text-[11px] text-faint">
              <LockIcon className="h-3 w-3" />
              Rules analysis runs in your browser. Nothing is stored.
            </p>
          </div>

          {/* Signal projection */}
          <div
            className="relative mx-auto h-[380px] w-full max-w-[460px] overflow-hidden rounded-2xl border border-line bg-white/[0.015] sm:h-[420px]"
            onMouseMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              setMousePos({
                x: (event.clientX - rect.left) / rect.width - 0.5,
                y: (event.clientY - rect.top) / rect.height - 0.5
              });
            }}
            onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
          >
            <div className="hero-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
            <div
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-cyan/[0.07] to-transparent hero-sweep"
              aria-hidden="true"
            />

            <div className="absolute inset-0">
              <SignalSphere prefersReduced={prefersReduced} mouseX={mousePos.x} mouseY={mousePos.y} />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-6">
              <div className="flex items-center gap-2 rounded-full border border-line bg-ink/80 px-3 py-2 shadow-panel backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-soft" />
                <span className="font-mono text-[10px] text-slate-300">Live signal projection</span>
              </div>
            </div>

            <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-cyan/40" aria-hidden="true" />
            <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-cyan/40" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-cyan/40" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-cyan/40" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <Reveal as="section" className="mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow-cyan">Capabilities</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              How PAKSH investigates
            </h2>
          </div>
          <Link to="/methodology" className="btn-ghost text-xs !px-3 !py-2">
            Read the methodology
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.id} delay={index * 70}>
                <div className="group relative card-glass h-full">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white/[0.02] transition-colors group-hover:border-cyan/40">
                    <Icon className="h-4 w-4 text-faint transition-colors group-hover:text-cyan" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">{feature.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Reveal>

      {/* Principles */}
      <Reveal as="section" className="mt-16 panel-soft p-8 sm:p-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="label">Zero fabricated results</p>
            <p className="mt-1 text-lg font-semibold text-white">Every signal traces to a rule</p>
            <p className="mt-1 text-xs text-faint">Weights are public and deterministic.</p>
          </div>
          <div>
            <p className="label">No invented reputation</p>
            <p className="mt-1 text-lg font-semibold text-white">External checks shown honestly</p>
            <p className="mt-1 text-xs text-faint">Unconfigured means unconfigured — never faked.</p>
          </div>
          <div>
            <p className="label">No black-box AI verdict</p>
            <p className="mt-1 text-lg font-semibold text-white">AI can explain, never decide</p>
            <p className="mt-1 text-xs text-faint">The score is rules-based only.</p>
          </div>
        </div>
      </Reveal>
    </PageLayout>
  );
}

function ScanSearch({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21 -4.3-4.3" />
    </svg>
  );
}

function LockIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
