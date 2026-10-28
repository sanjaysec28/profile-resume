/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface PageHeaderProps {
  title: string;
  description?: string;
  kicker?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  kicker,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 sm:pb-8 border-b border-[#E5E0D8]/80 mb-8 sm:mb-10',
        className
      )}
    >
      <div className="max-w-2xl">
        {kicker && (
          <p className="text-xs font-medium text-[#777777] uppercase tracking-wider mb-2">
            {kicker}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#101010] text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-[#777777] mt-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
