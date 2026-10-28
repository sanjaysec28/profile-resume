/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Faceless 3D student boy avatar in matte clay monochrome aesthetic
 * Cream (#F8F5EE) & Obsidian (#101010) styling.
 */

interface AvatarProps {
  className?: string;
  size?: number | string;
}

export function AvatarBoyIllustration({ className = '', size = '100%' }: AvatarProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Faceless 3D Student Boy Avatar"
    >
      <defs>
        <radialGradient id="boy_bg" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EFEAE0" />
        </radialGradient>
        <linearGradient id="boy_skin" x1="60" y1="36" x2="60" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EFE9DC" />
          <stop offset="100%" stopColor="#DFD7C7" />
        </linearGradient>
        <linearGradient id="boy_hair" x1="38" y1="20" x2="82" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#282828" />
          <stop offset="100%" stopColor="#101010" />
        </linearGradient>
        <linearGradient id="boy_shirt" x1="30" y1="85" x2="90" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#222222" />
          <stop offset="100%" stopColor="#121212" />
        </linearGradient>
        <filter id="boy_shadow" x="15" y="15" width="90" height="95" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#101010" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Circle boundary */}
      <circle cx="60" cy="60" r="58" fill="url(#boy_bg)" stroke="#E5E0D8" strokeWidth="1.5" />

      <g filter="url(#boy_shadow)">
        {/* Torso / Student hoodie */}
        <path
          d="M26 112C26 95 38 88 60 88C82 88 94 95 94 112"
          fill="url(#boy_shirt)"
        />
        {/* Collar / neckline */}
        <path
          d="M50 88C50 95 70 95 70 88"
          stroke="#3A3A3A"
          strokeWidth="2"
          fill="none"
        />

        {/* Neck */}
        <rect x="53" y="70" width="14" height="18" rx="4" fill="#D8CFBE" />

        {/* 3D Faceless Head */}
        <ellipse cx="60" cy="54" rx="20" ry="24" fill="url(#boy_skin)" />

        {/* Ears */}
        <ellipse cx="39" cy="55" rx="3.5" ry="6" fill="#D8CFBE" />
        <ellipse cx="81" cy="55" rx="3.5" ry="6" fill="#D8CFBE" />

        {/* 3D Boy Hair (matte short clay textured crop) */}
        <path
          d="M38 48C37 34 46 22 60 22C74 22 83 34 82 48C78 45 74 44 68 44C62 44 56 46 52 44C47 42 42 45 38 48Z"
          fill="url(#boy_hair)"
        />
        <path
          d="M38 48C39 54 39 58 41 62C42 56 43 52 45 50"
          fill="url(#boy_hair)"
        />
        <path
          d="M82 48C81 54 81 58 79 62C78 56 77 52 75 50"
          fill="url(#boy_hair)"
        />
      </g>
    </svg>
  );
}
