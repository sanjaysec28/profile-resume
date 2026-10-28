/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile Official Brand Logo Component
 * - Displays the official logo.png with natural horizontal aspect ratio (~3.3:1)
 * - object-fit: contain with no artificial background box or border
 * - Graceful fallback to sharp typography if asset is unavailable
 */

import React, { useState } from 'react';

export interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  alt?: string;
  onClick?: () => void;
}

export function Logo({
  className = '',
  size = 'md',
  alt = 'ProFile',
  onClick,
}: LogoProps) {
  const [hasError, setHasError] = useState(false);

  // Height mappings matching natural horizontal proportions (larger, bolder logo presentation)
  const sizeClasses = {
    sm: 'h-7 sm:h-8', // ~100px - 115px width
    md: 'h-8 sm:h-9 md:h-10', // ~120px - 145px width
    lg: 'h-10 sm:h-12 md:h-14', // ~150px - 200px width
    xl: 'h-14 sm:h-16 md:h-20', // ~210px - 280px width
  };

  if (hasError) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 font-bold tracking-tight text-[#101010] select-none ${
          size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl'
        } ${className}`}
        onClick={onClick}
      >
        <div className="w-6 h-6 rounded-lg bg-[#101010] text-[#F8F5EE] flex items-center justify-center text-xs font-black">
          P
        </div>
        <span className="font-extrabold tracking-tight">ProFile</span>
      </div>
    );
  }

  return (
    <img
      src="/image/logo.png"
      alt={alt}
      className={`w-auto object-contain shrink-0 transition-opacity select-none ${sizeClasses[size]} ${className}`}
      loading="eager"
      onError={(e) => {
        const target = e.currentTarget;
        if (target.src.indexOf('/images/logo.png') === -1) {
          target.src = '/images/logo.png';
        } else {
          setHasError(true);
        }
      }}
      onClick={onClick}
    />
  );
}
