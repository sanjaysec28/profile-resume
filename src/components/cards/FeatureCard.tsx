/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Prominent Dashboard Feature Card component
 * Designed specifically for the 3 core features:
 * 1. Build Resume
 * 2. ATS Checker
 * 3. My Profile
 */

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface FeatureCardProps {
  title: string;
  subtitle: string;
  illustration: React.ReactNode;
  actionText: string;
  stats?: string;
  onClick: () => void;
  className?: string;
  badge?: string;
}

export function FeatureCard({
  title,
  subtitle,
  illustration,
  actionText,
  stats,
  onClick,
  className,
  badge,
}: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'group relative flex flex-col justify-between text-left cursor-pointer select-none',
        'bg-[#F8F8F6] border border-[#E5E0D8] rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 lg:p-7',
        'hover:bg-white hover:border-[#D1C9BE] hover:shadow-lg hover:-translate-y-1',
        'transition-all duration-300 ease-out focus-visible:ring-2 focus-visible:ring-[#101010]',
        className
      )}
    >
      {/* Top illustration container - square ratio on mobile, generous height on desktop */}
      <div className="relative w-full aspect-square sm:aspect-4/3 lg:aspect-square max-h-[220px] sm:max-h-[260px] rounded-2xl bg-[#F4EFE6]/70 border border-[#E5E0D8]/60 flex items-center justify-center p-4 overflow-hidden mb-5 sm:mb-6 group-hover:bg-[#F2ECE0]/90 transition-colors">
        {badge && (
          <div className="absolute top-3 left-3 z-10 text-[11px] font-medium tracking-tight px-2 py-0.5 rounded-md bg-white/90 text-[#101010] border border-[#E5E0D8] shadow-2xs">
            {badge}
          </div>
        )}
        <div className="w-full h-full flex items-center justify-center transform group-hover:scale-[1.03] transition-transform duration-300 ease-out">
          {illustration}
        </div>
      </div>

      {/* Card Body */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#101010] group-hover:text-black">
              {title}
            </h3>
            <div className="w-9 h-9 rounded-full bg-[#EFE9DF] group-hover:bg-[#101010] group-hover:text-white text-[#101010] flex items-center justify-center transition-all duration-200 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#777777] mt-2 line-clamp-2 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Footer info & CTA */}
        <div className="mt-5 pt-4 border-t border-[#E5E0D8]/60 flex items-center justify-between text-xs">
          {stats ? (
            <span className="text-[#A3A3A3] font-medium">{stats}</span>
          ) : (
            <span />
          )}
          <span className="font-semibold text-[#101010] group-hover:underline underline-offset-4">
            {actionText}
          </span>
        </div>
      </div>
    </div>
  );
}
