/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        'navy-dark': '#020617',
        'navy-card': '#111827',
        cyan: '#22d3ee',
        'cyan-dim': '#064e3b',
        violet: '#8b5cf6',
        'violet-dim': '#4c1d95',
        danger: '#ef4444',
        'danger-dim': '#7f1d1d',
        safe: '#22c55e',
        'safe-dim': '#14532d',
        muted: '#64748b'
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px'
      },
      boxShadow: {
        glow: '0 0 24px rgba(34, 211, 238, 0.15)',
        'glow-red': '0 0 24px rgba(239, 68, 68, 0.15)',
        'glow-green': '0 0 24px rgba(34, 197, 94, 0.15)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }
    },
  },
  plugins: [],
}