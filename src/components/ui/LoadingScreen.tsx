/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile Branded Loading Screen
 * Minimal rotating spinner with official horizontal ProFile logo on warm cream background.
 * Displayed only during genuine app initialization or required route data loading.
 */

import React, { useEffect, useState } from 'react';
import { Logo } from './Logo.tsx';

export interface LoadingScreenProps {
  isLoading?: boolean;
  message?: string;
  onFinished?: () => void;
}

export function LoadingScreen({
  isLoading = true,
  message,
  onFinished,
}: LoadingScreenProps) {
  const [shouldRender, setShouldRender] = useState(isLoading);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        onFinished?.();
      }, 240);
      return () => clearTimeout(timer);
    } else {
      setShouldRender(true);
      setIsFadingOut(false);
    }
  }, [isLoading, onFinished]);

  if (!shouldRender) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading ProFile"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F5EE] select-none transition-opacity duration-200 ease-out motion-reduce:transition-none ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-5 px-6 animate-page-enter">
        {/* Official Brand Logo */}
        <Logo size="lg" alt="ProFile loading" />

        {/* Minimal rotating spinner & indicator */}
        <div className="flex items-center gap-3 mt-1">
          <div
            className="w-5 h-5 rounded-full border-2 border-[#E5E0D8] border-t-[#101010] animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          {message && (
            <span className="text-xs font-medium text-[#777777] tracking-tight">
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
