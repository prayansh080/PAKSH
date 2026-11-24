/**
 * BrandMark — PAKSH brand mark SVG.
 */
export function BrandMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="paksh-brand" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="0.55" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#05070d" />
      <rect x="1" y="1" width="62" height="62" rx="15" stroke="url(#paksh-brand)" strokeOpacity="0.45" />
      <path
        d="M32 12 50 19v13c0 10.4-7.2 17.6-18 21-10.8-3.4-18-10.6-18-21V19l18-7Z"
        stroke="url(#paksh-brand)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M20 32c3.4-5.2 7.4-7.8 12-7.8S40.6 26.8 44 32c-3.4 5.2-7.4 7.8-12 7.8S23.4 37.2 20 32Z"
        stroke="url(#paksh-brand)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="3.4" fill="url(#paksh-brand)" />
      <path d="M32 12v6" stroke="url(#paksh-brand)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
