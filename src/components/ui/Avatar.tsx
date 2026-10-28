/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AvatarType } from '../../types/profile.ts';
import { AvatarBoyIllustration } from '../illustrations/AvatarBoyIllustration.tsx';
import { AvatarGirlIllustration } from '../illustrations/AvatarGirlIllustration.tsx';
import { cn } from '../../lib/utils.ts';

export interface AvatarProps {
  type?: AvatarType;
  imageUrl?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  bordered?: boolean;
}

export function Avatar({
  type = 'boy',
  imageUrl,
  name,
  size = 'md',
  className,
  bordered = true,
}: AvatarProps) {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
    '2xl': 'w-32 h-32 text-3xl',
  };

  const getInitials = (n?: string) => {
    if (!n) return 'P';
    return n
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden select-none',
        bordered && 'ring-1 ring-[#E5E0D8] shadow-2xs',
        sizeMap[size],
        className
      )}
    >
      {type === 'boy' ? (
        <AvatarBoyIllustration size="100%" />
      ) : type === 'girl' ? (
        <AvatarGirlIllustration size="100%" />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt={name || 'User avatar'}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-[#1C1C1C] text-[#F8F5EE] flex items-center justify-center font-medium">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
