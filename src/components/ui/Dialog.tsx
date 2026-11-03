/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Shared Accessible Dialog / Modal Component
 * Renders via React Portal directly into document.body to escape transformed containing blocks.
 * Subtle backdrop (rgba(0,0,0,0.35)) with zero filter: blur() or opacity interference.
 * Pinned header, independently scrollable form body, and pinned action footer.
 * Leak-free, reference-counted body scroll locking.
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { lockBodyScroll, unlockBodyScroll } from '../../lib/scrollLock.ts';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  bodyClassName?: string;
  onSubmit?: (e: React.FormEvent) => void;
  id?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  className,
  bodyClassName,
  onSubmit,
  id,
}: DialogProps) {
  // Stable ref for onClose to prevent re-locking or thrashing if parent recreates inline handler
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Handle scroll lock and Escape key dismissing
  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  // Exact viewport width mapping adhering to width: min(560px, calc(100vw - 32px))
  const maxWidthMap: Record<string, string> = {
    sm: '448px',
    md: '560px',
    lg: '640px',
    xl: '768px',
    '2xl': '896px',
  };
  const targetWidth = maxWidthMap[maxWidth] || '560px';

  const WrapperTag = onSubmit ? 'form' : 'div';

  const dialogElement = (
    <div
      role="dialog"
      aria-modal="true"
      id={id}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{
        paddingTop: 'max(16px, env(safe-area-inset-top, 16px))',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
        paddingLeft: 'max(16px, env(safe-area-inset-left, 16px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
      }}
    >
      {/* 
        Subtle Backdrop Layer:
        - Exact subtle shade rgba(0, 0, 0, 0.35)
        - NO heavy blur, no filter: blur()
        - Positioned behind the dialog card (z-0)
        - Listens for clicks outside the dialog to close
      */}
      <div
        onClick={() => onCloseRef.current?.()}
        className="fixed inset-0 transition-opacity duration-150 cursor-pointer"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
        }}
        aria-hidden="true"
      />

      {/* 
        Dialog Card:
        - Elevated above backdrop (relative z-10)
        - Display flex, flex-direction column, min-height 0
        - Width: min(560px, calc(100vw - 32px))
        - Max height: calc(100dvh - 32px)
        - Clean cream-and-white theme
      */}
      <WrapperTag
        onSubmit={onSubmit}
        className={cn(
          'relative z-10 w-full flex flex-col min-h-0 bg-[#FAF8F5] border border-[#E5E0D8]',
          'rounded-[24px] sm:rounded-[28px] shadow-2xl overflow-hidden',
          className
        )}
        style={{
          width: `min(${targetWidth}, calc(100vw - 32px))`,
          maxHeight: 'calc(100dvh - 32px)',
        }}
      >
        {/* Pinned Header: fixed within the dialog, does not scroll */}
        {(title || description) && (
          <div className="shrink-0 px-5 sm:px-6 py-4 sm:py-4.5 bg-white border-b border-[#E5E0D8] flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {title && (
                <h3 className="text-base sm:text-lg font-bold text-[#101010] tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-[#777777] mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onCloseRef.current?.()}
              className="shrink-0 p-1.5 sm:p-2 -mr-1 -mt-0.5 rounded-xl text-[#777777] hover:text-[#101010] hover:bg-[#F2ECE1] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#101010] cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 
          Independently Scrollable Form Body:
          - flex: 1; min-height: 0; overflow-y: auto
          - overscroll-contain keeps scroll chain isolated to modal
          - Works smoothly with mouse-wheel, touch, keyboard, and scrollbar
        */}
        <div
          className={cn(
            'flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-6 py-5',
            bodyClassName
          )}
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>

        {/* Pinned Footer / Actions: always visible and accessible at the bottom */}
        {footer && (
          <div className="shrink-0 px-5 sm:px-6 py-3.5 sm:py-4 bg-white border-t border-[#E5E0D8] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </WrapperTag>
    </div>
  );

  return createPortal(dialogElement, document.body);
}
