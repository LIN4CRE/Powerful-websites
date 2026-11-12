import { useId } from 'react';

export function LogoMark({ size = 34 }: { size?: number }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Powerful Websites mark"
      className="logo-mark"
    >
      <defs>
        <linearGradient id={`pw-grad-${id}`} x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9df7ff" />
          <stop offset="0.5" stopColor="#38e8ff" />
          <stop offset="1" stopColor="#4f8cff" />
        </linearGradient>
      </defs>
      <rect x="0.9" y="0.9" width="38.2" height="38.2" rx="11.5" fill={`url(#pw-grad-${id})`} opacity="0.12" />
      <rect
        x="0.9"
        y="0.9"
        width="38.2"
        height="38.2"
        rx="11.5"
        fill="none"
        stroke={`url(#pw-grad-${id})`}
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />
      <path
        d="M10.6 27.4 20 10.8l9.4 16.6"
        fill="none"
        stroke={`url(#pw-grad-${id})`}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 22.7h9.6"
        fill="none"
        stroke={`url(#pw-grad-${id})`}
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="20" cy="10.8" r="2.3" fill="#baf9ff" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex flex-col leading-none">
      <span className="text-[0.94rem] font-semibold tracking-[0.18em] text-[var(--text)]">
        POWERFUL
        <span className="ml-1.5 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
          WEBSITES
        </span>
      </span>
      {!compact && (
        <span className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.3em] text-[var(--faint)]">
          open web directory
        </span>
      )}
    </span>
  );
}
