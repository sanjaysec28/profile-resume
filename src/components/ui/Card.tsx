/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '../../lib/utils.ts';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cream' | 'white' | 'dark' | 'elevated';
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'lg' | 'xl' | '2xl' | '3xl';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'cream',
      interactive = false,
      padding = 'md',
      rounded = '2xl',
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      cream: 'bg-[#F8F8F6] border border-[#E5E0D8] text-[#101010]',
      white: 'bg-white border border-[#E5E0D8] text-[#101010]',
      dark: 'bg-[#242424] border border-[#3A3A3A] text-[#F8F5EE]',
      elevated: 'bg-[#1C1C1C] border border-[#333333] text-[#F8F5EE]',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-3.5',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
      xl: 'p-8 sm:p-10',
    };

    const roundings = {
      lg: 'rounded-xl',
      xl: 'rounded-2xl',
      '2xl': 'rounded-2xl sm:rounded-[24px]',
      '3xl': 'rounded-3xl sm:rounded-[32px]',
    };

    const interactiveStyles = interactive
      ? 'cursor-pointer hover:border-[#D1C9BE] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          'transition-all duration-200 shadow-2xs',
          variants[variant],
          paddings[padding],
          roundings[rounded],
          interactiveStyles,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
