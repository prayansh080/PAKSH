/** @type {import('tailwindcss').Config} */

// Every palette entry resolves through a CSS variable defined in src/index.css.
// `<alpha-value>` keeps opacity utilities such as `bg-cyan/10` and
// `bg-white/[0.02]` working in both themes.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Core surfaces
        ink: token('--c-bg'),
        'ink-2': token('--c-bg-2'),
        navy: token('--c-navy'),
        'navy-dark': token('--c-bg'),
        'navy-card': token('--c-navy'),
        surface: token('--c-surface'),
        'surface-2': token('--c-surface-2'),
        'surface-3': token('--c-surface-3'),

        // "white" is the foreground ink: in light mode it flips to near-black,
        // which also turns bg-white/[0.02] overlays into faint dark tints.
        white: token('--c-fg'),
        line: 'rgb(var(--c-line) / var(--line-alpha))',
        'line-strong': 'rgb(var(--c-line) / var(--line-alpha-strong))',

        // Text scale
        slate: {
          100: token('--c-slate-100'),
          200: token('--c-slate-200'),
          300: token('--c-slate-300'),
          400: token('--c-slate-400'),
          500: token('--c-slate-500')
        },

        // Accents
        cyan: token('--c-cyan'),
        'cyan-dim': token('--c-cyan-dim'),
        electric: token('--c-electric'),
        violet: token('--c-violet'),
        'violet-dim': token('--c-violet-dim'),
        danger: token('--c-danger'),
        'danger-dim': token('--c-danger-dim'),
        safe: token('--c-safe'),
        'safe-dim': token('--c-safe-dim'),
        // Shade keys keep existing `text-amber-400` / `border-amber-500/30`
        // utilities resolving to the themed accent instead of nothing.
        amber: {
          DEFAULT: token('--c-amber'),
          300: token('--c-amber'),
          400: token('--c-amber'),
          500: token('--c-amber'),
          600: token('--c-amber')
        },
        sky: {
          300: token('--c-cyan'),
          400: token('--c-cyan'),
          500: token('--c-cyan')
        },
        muted: token('--c-muted'),
        faint: token('--c-faint')
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace']
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '22px'
      },
      boxShadow: {
        glow: '0 0 24px rgba(34, 211, 238, 0.15)',
        'glow-red': '0 0 24px rgba(244, 63, 94, 0.15)',
        'glow-green': '0 0 24px rgba(52, 211, 153, 0.15)',
        panel: 'var(--shadow-panel)',
        'panel-soft': 'var(--shadow-panel-soft)'
      },
      keyframes: {
        'float-y': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' }
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' }
        },
        'scan-sweep': {
          '0%': { transform: 'translateX(-110%)' },
          '100%': { transform: 'translateX(210%)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'glow-pulse': {
          '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
          '50%': { opacity: 0.6, transform: 'scale(1.05)' }
        },
        'fade-in': {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      animation: {
        'float-y': 'float-y 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3.2s ease-in-out infinite',
        'scan-sweep': 'scan-sweep 2.6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
        'fade-up': 'fade-up 0.5s ease-out both',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.8s ease-out both'
      }
    }
  },
  plugins: []
};
