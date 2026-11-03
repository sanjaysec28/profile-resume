/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile — Modal Body Scroll Lock Manager
 * Reference-counted, leak-free scroll locking.
 * Ensures the background document stays stationary while a modal is open,
 * allows independent scrolling inside modal containers, and restores original
 * document overflow when all modals close.
 */

let activeLockCount = 0;
let savedBodyOverflow = '';
let savedBodyPaddingRight = '';

export function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;

  if (activeLockCount === 0) {
    savedBodyOverflow = document.body.style.overflow;
    savedBodyPaddingRight = document.body.style.paddingRight;

    // Prevent layout shift when scrollbar is hidden
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';
  }

  activeLockCount++;
}

export function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;

  activeLockCount = Math.max(0, activeLockCount - 1);

  if (activeLockCount === 0) {
    document.body.style.overflow = savedBodyOverflow || '';
    document.body.style.paddingRight = savedBodyPaddingRight || '';
  }
}

export function forceUnlockAllScroll(): void {
  if (typeof document === 'undefined') return;
  activeLockCount = 0;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}
