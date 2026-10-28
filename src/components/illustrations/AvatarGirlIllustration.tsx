/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Faceless 3D student girl avatar in matte clay monochrome aesthetic
 * Cream (#F8F5EE) & Obsidian (#101010) styling.
 */

interface AvatarProps {
  className?: string;
  size?: number | string;
}

export function AvatarGirlIllustration({ className = '', size = '100%' }: AvatarProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Faceless 3D Student Girl Avatar"
    >
      <defs>
        <radialGradient id="girl_bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFEAE0" />
        </radialGradient>
        <linearGradient id="girl_skin" x1="60" y1="36" x2="60" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EFE9DC" />
          <stop offset="100%" stopColor="#DFD7C7" />
        </linearGradient>
        <linearGradient id="girl_hair" x1="36" y1="18" x2="84" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#282828" />
          <stop offset="100%" stopColor="#101010" />
        </linearGradient>
        <linearGradient id="girl_top" x1="30" y1="85" x2="90" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#222222" />
          <stop offset="100%" stopColor="#121212" />
        </linearGradient>
        <filter id="girl_shadow" x="15" y="15" width="90" height="95" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#101010" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Circle boundary */}
      <circle cx="60" cy="60" r="58" fill="url(#girl_bg)" stroke="#E5E0D8" strokeWidth="1.5" />

      <g filter="url(#girl_shadow)">
        {/* Back hair flow */}
        <path
          d="M34 50C34 76 40 85 40 85H80C80 85 86 76 86 50C86 28 78 20 60 20C42 20 34 28 34 50Z"
          fill="url(#girl_hair)"
        />

        {/* Torso / Student sweater */}
        <path
          d="M26 112C26 95 38 88 60 88C82 88 94 95 94 112"
          fill="url(#girl_top)"
        />
        {/* Collar line */}
        <path
          d="M49 88C49 96 71 96 71 88"
          stroke="#3A3A3A"
          strokeWidth="1.75"
          fill="none"
        />

        {/* Neck */}
        <rect x="54" y="68" width="12" height="20" rx="4" fill="#D8CFBE" />

        {/* 3D Faceless Head */}
        <ellipse cx="60" cy="54" rx="19" ry="23" fill="url(#girl_skin)" />

        {/* Ears with subtle pearl stud */}
        <ellipse cx="40" cy="56" rx="3" ry="5.5" fill="#D8CFBE" />
        <circle cx="40" cy="57" r="1.5" fill="#FFFFFF" />
        <ellipse cx="80" cy="56" rx="3" ry="5.5" fill="#D8CFBE" />
        <circle cx="80" cy="57" r="1.5" fill="#FFFFFF" />

        {/* Front Hair / Bob with curtain fringe */}
        <path
          d="M36 46C36 30 46 20 60 20C74 20 84 30 84 46C80 43 73 40 65 42C61 43 56 47 50 44C44 41 39 43 36 46Z"
          fill="url(#girl_hair)"
        />
        <path
          d="M36 46C36 58 39 70 42 75C44 65 44 54 46 48"
          fill="url(#girl_hair)"
        />
        <path
          d="M84 46C84 58 81 70 78 75C76 65 76 54 74 48"
          fill="url(#girl_hair)"
        />
      </g>
    </svg>
  );
}
