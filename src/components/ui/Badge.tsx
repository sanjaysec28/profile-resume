/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Clean typographic badge component adhering to zero-pill discipline.
 * Supports quiet inline labels, unboxed metadata, and segmented state markers.
 */

import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'subtle' | 'dark' | 'outline' | 'unboxed';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'subtle',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  if (variant === 'unboxed') {
    return (
      <span
        className={cn(
          'text-xs font-medium text-[#777777] tracking-tight inline-flex items-center gap-1.5',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }

  const variants = {
    subtle: 'bg-[#EFEAE1] text-[#101010] border border-[#E0D8CB]',
    dark: 'bg-[#1C1C1C] text-[#F8F5EE] border border-[#333333]',
    outline: 'bg-transparent text-[#777777] border border-[#E5E0D8]',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-lg font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center tracking-tight transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
