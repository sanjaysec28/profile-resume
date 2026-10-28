/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Soft 3D matte illustration for "Build Resume" feature card
 * Adheres strictly to cream (#F8F5EE) & obsidian (#101010) monochrome palette.
 */

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

export function BuildResumeIllustration({ className = '', size = '100%' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Build Resume illustration"
    >
      <defs>
        <radialGradient id="br_ambient" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#F4EFE6" stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="br_card_grad1" x1="50" y1="40" x2="190" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F5F2EB" />
        </linearGradient>
        <linearGradient id="br_card_grad2" x1="70" y1="50" x2="170" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#ECE6DA" />
        </linearGradient>
        <linearGradient id="br_dark_pill" x1="75" y1="75" x2="135" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C1C1C" />
          <stop offset="100%" stopColor="#101010" />
        </linearGradient>
        <filter id="br_shadow" x="30" y="30" width="180" height="180" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#101010" floodOpacity="0.08" />
        </filter>
        <filter id="br_subtle_shadow" x="20" y="20" width="200" height="200" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#101010" floodOpacity="0.05" />
        </filter>
      </defs>

      {/* Ambient background glow */}
      <circle cx="120" cy="120" r="95" fill="url(#br_ambient)" />

      {/* Back resume card (angled) */}
      <g transform="rotate(-6 120 120)" filter="url(#br_subtle_shadow)">
        <rect
          x="62"
          y="42"
          width="116"
          height="146"
          rx="14"
          fill="#ECE7DE"
          stroke="#E0D9CD"
          strokeWidth="1.5"
        />
        {/* Subtle wireframe lines on back card */}
        <rect x="76" y="58" width="40" height="6" rx="3" fill="#D3CABE" />
        <rect x="76" y="72" width="88" height="4" rx="2" fill="#DDD5C8" />
        <rect x="76" y="82" width="70" height="4" rx="2" fill="#DDD5C8" />
      </g>

      {/* Front primary resume card */}
      <g filter="url(#br_shadow)">
        <rect
          x="58"
          y="48"
          width="124"
          height="152"
          rx="16"
          fill="url(#br_card_grad1)"
          stroke="#E5E0D8"
          strokeWidth="1.5"
        />

        {/* Header avatar / photo silhouette */}
        <circle cx="82" cy="74" r="12" fill="#F0ECE3" stroke="#E5E0D8" strokeWidth="1" />
        <circle cx="82" cy="71" r="5" fill="#A3A3A3" />
        <path d="M74 81C74 77 77.5 75 82 75C86.5 75 90 77 90 81" fill="#A3A3A3" />

        {/* Name & Title block */}
        <rect x="102" y="67" width="56" height="6.5" rx="3" fill="url(#br_dark_pill)" />
        <rect x="102" y="78" width="40" height="4" rx="2" fill="#A3A3A3" />

        {/* Section 1 Divider */}
        <line x1="72" y1="96" x2="168" y2="96" stroke="#EAE5DC" strokeWidth="1.5" strokeLinecap="round" />

        {/* Experience section */}
        <rect x="72" y="106" width="30" height="5" rx="2.5" fill="#1C1C1C" />
        <rect x="72" y="117" width="96" height="4" rx="2" fill="#C9C2B6" />
        <rect x="72" y="126" width="84" height="4" rx="2" fill="#D8D2C7" />
        <rect x="72" y="135" width="72" height="4" rx="2" fill="#E4DED4" />

        {/* Education section */}
        <rect x="72" y="149" width="36" height="5" rx="2.5" fill="#1C1C1C" />
        <rect x="72" y="160" width="96" height="4" rx="2" fill="#C9C2B6" />
        <rect x="72" y="169" width="64" height="4" rx="2" fill="#D8D2C7" />

        {/* Subtle status check emblem on bottom right */}
        <circle cx="158" cy="176" r="10" fill="#101010" />
        <path d="M154.5 176L157 178.5L162 173.5" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Floating 3D Stylus / Pen */}
      <g transform="rotate(24 185 85)">
        <rect x="180" y="35" width="10" height="65" rx="5" fill="#1C1C1C" />
        <rect x="181.5" y="42" width="7" height="14" rx="2" fill="#3A3A3A" />
        <path d="M180 100L185 110L190 100Z" fill="#777777" />
        <circle cx="185" cy="110" r="1.5" fill="#101010" />
      </g>
    </svg>
  );
}
