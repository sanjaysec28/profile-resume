/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Soft 3D matte illustration for "My Profile" feature card
 * Adheres strictly to cream (#F8F5EE) & obsidian (#101010) monochrome palette.
 */

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

export function MyProfileIllustration({ className = '', size = '100%' }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="My Profile illustration"
    >
      <defs>
        <radialGradient id="mp_ambient" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#F4EFE6" stopOpacity="0.2" />
        </radialGradient>
        <linearGradient id="mp_badge_grad" x1="60" y1="50" x2="180" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F6F3EC" />
        </linearGradient>
        <filter id="mp_shadow" x="35" y="35" width="170" height="185" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#101010" floodOpacity="0.08" />
        </filter>
        <filter id="mp_avatar_shadow" x="80" y="70" width="80" height="80" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#101010" floodOpacity="0.06" />
        </filter>
      </defs>

      {/* Ambient background glow */}
      <circle cx="120" cy="120" r="95" fill="url(#mp_ambient)" />

      {/* Lanyard strap at top */}
      <path
        d="M102 18L108 52H132L138 18"
        stroke="#101010"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="105" y="44" width="30" height="10" rx="3" fill="#2A2A2A" stroke="#E5E0D8" strokeWidth="1" />
      <circle cx="120" cy="49" r="2.5" fill="#FFFFFF" />

      {/* Main Student ID Badge */}
      <g filter="url(#mp_shadow)">
        <rect
          x="58"
          y="48"
          width="124"
          height="156"
          rx="18"
          fill="url(#mp_badge_grad)"
          stroke="#E5E0D8"
          strokeWidth="1.5"
        />

        {/* Lanyard slot hole */}
        <rect x="106" y="56" width="28" height="5" rx="2.5" fill="#E5E0D8" />

        {/* 3D Student Portrait Frame */}
        <g filter="url(#mp_avatar_shadow)">
          <circle cx="120" cy="98" r="26" fill="#F0ECE3" stroke="#E5E0D8" strokeWidth="1.5" />
          {/* Faceless student silhouette */}
          <circle cx="120" cy="92" r="10" fill="#1C1C1C" />
          <path d="M103 118C103 108 110 106 120 106C130 106 137 108 137 118" fill="#1C1C1C" />
        </g>

        {/* Graduation cap emblem floating near head */}
        <g transform="translate(136, 74)">
          <circle cx="8" cy="8" r="10" fill="#101010" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M4 8L8 6L12 8L8 10L4 8Z" fill="#FFFFFF" />
          <path d="M6 9.5V11C6 11.8 6.9 12.5 8 12.5C9.1 12.5 10 11.8 10 11V9.5" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
        </g>

        {/* Student Name */}
        <rect x="85" y="136" width="70" height="7" rx="3.5" fill="#101010" />

        {/* Major & Year */}
        <rect x="92" y="148" width="56" height="4.5" rx="2" fill="#777777" />

        {/* ID Barcode / Meta lines at bottom */}
        <line x1="74" y1="168" x2="166" y2="168" stroke="#EAE5DC" strokeWidth="1" strokeLinecap="round" />

        {/* Student Card Barcode simulation */}
        <g opacity="0.6">
          <line x1="84" y1="176" x2="84" y2="188" stroke="#101010" strokeWidth="2" strokeLinecap="round" />
          <line x1="90" y1="176" x2="90" y2="188" stroke="#101010" strokeWidth="1" />
          <line x1="94" y1="176" x2="94" y2="188" stroke="#101010" strokeWidth="3" strokeLinecap="round" />
          <line x1="100" y1="176" x2="100" y2="188" stroke="#101010" strokeWidth="1" />
          <line x1="106" y1="176" x2="106" y2="188" stroke="#101010" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="114" y1="176" x2="114" y2="188" stroke="#101010" strokeWidth="1" />
          <line x1="120" y1="176" x2="120" y2="188" stroke="#101010" strokeWidth="3" strokeLinecap="round" />
          <line x1="128" y1="176" x2="128" y2="188" stroke="#101010" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="134" y1="176" x2="134" y2="188" stroke="#101010" strokeWidth="2" strokeLinecap="round" />
          <line x1="142" y1="176" x2="142" y2="188" stroke="#101010" strokeWidth="3" strokeLinecap="round" />
          <line x1="150" y1="176" x2="150" y2="188" stroke="#101010" strokeWidth="1" />
          <line x1="156" y1="176" x2="156" y2="188" stroke="#101010" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
