/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Soft 3D matte illustration for "ATS Checker" feature card
 * Adheres strictly to cream (#F8F5EE) & obsidian (#101010) monochrome palette.
 */

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

export function AtsCheckerIllustration({ className = '', size = '100%' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="ATS Checker illustration"
    >
      <defs>
        <radialGradient id="ats_ambient" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#F4EFE6" stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="ats_card_grad" x1="45" y1="45" x2="175" y2="185" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F6F3EC" />
        </linearGradient>
        <linearGradient id="ats_lens_rim" x1="90" y1="70" x2="190" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2A2A2A" />
          <stop offset="100%" stopColor="#101010" />
        </linearGradient>
        <radialGradient id="ats_glass" cx="130" cy="115" r="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#EBE4D8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#DDD4C5" stopOpacity="0.5" />
        </radialGradient>
        <filter id="ats_shadow" x="20" y="25" width="200" height="195" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#101010" floodOpacity="0.08" />
        </filter>
        <filter id="ats_lens_shadow" x="85" y="65" width="120" height="135" filterUnits="userSpaceOnUse">
          <feDropShadow dx="4" dy="10" stdDeviation="10" floodColor="#101010" floodOpacity="0.14" />
        </filter>
      </defs>

      {/* Ambient background glow */}
      <circle cx="120" cy="120" r="95" fill="url(#ats_ambient)" />

      {/* Background document grid */}
      <g filter="url(#ats_shadow)">
        <rect
          x="52"
          y="42"
          width="120"
          height="156"
          rx="16"
          fill="url(#ats_card_grad)"
          stroke="#E5E0D8"
          strokeWidth="1.5"
        />

        {/* Document Header lines */}
        <rect x="68" y="60" width="48" height="6" rx="3" fill="#1C1C1C" />
        <rect x="68" y="72" width="65" height="4" rx="2" fill="#A3A3A3" />

        {/* Scanned code / text rows */}
        <g opacity="0.85">
          <rect x="68" y="90" width="88" height="4" rx="2" fill="#D3CABE" />
          <rect x="68" y="100" width="76" height="4" rx="2" fill="#DDD5C8" />
          <rect x="68" y="110" width="84" height="4" rx="2" fill="#DDD5C8" />
          <rect x="68" y="120" width="56" height="4" rx="2" fill="#E4DED4" />
        </g>

        {/* Lower section text */}
        <g opacity="0.75">
          <rect x="68" y="138" width="40" height="5" rx="2.5" fill="#1C1C1C" />
          <rect x="68" y="150" width="88" height="4" rx="2" fill="#D3CABE" />
          <rect x="68" y="160" width="65" height="4" rx="2" fill="#DDD5C8" />
          <rect x="68" y="170" width="78" height="4" rx="2" fill="#E4DED4" />
        </g>
      </g>

      {/* 3D Magnifying Scanner Lens floating over document */}
      <g filter="url(#ats_lens_shadow)">
        {/* Handle */}
        <path
          d="M172 154L196 178"
          stroke="#101010"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M172 154L196 178"
          stroke="#2A2A2A"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Outer Ring */}
        <circle cx="140" cy="120" r="42" fill="url(#ats_lens_rim)" stroke="#E5E0D8" strokeWidth="2" />
        {/* Inner Bezel */}
        <circle cx="140" cy="120" r="35" fill="none" stroke="#3A3A3A" strokeWidth="2.5" />
        {/* Glass Reflection */}
        <circle cx="140" cy="120" r="34" fill="url(#ats_glass)" />

        {/* Magnified Target / Verified Match Badge inside Lens */}
        <circle cx="140" cy="120" r="18" fill="#FFFFFF" stroke="#E5E0D8" strokeWidth="1" />
        {/* ATS Score / Check indicator */}
        <path
          d="M133 120L138 125L148 114"
          stroke="#101010"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crosshair target ticks */}
        <line x1="140" y1="92" x2="140" y2="97" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="140" y1="143" x2="140" y2="148" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="112" y1="120" x2="117" y2="120" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="163" y1="120" x2="168" y2="120" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />

        {/* Lens glare highlight arc */}
        <path
          d="M120 102C126 95 138 92 148 95"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </svg>
  );
}
