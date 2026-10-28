/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Clean class name concatenation utility
 */
export function cn(...classes: (string | number | boolean | undefined | null | unknown)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format score to 0-100 display
 */
export function formatScore(score: number): string {
  return `${Math.round(Math.max(0, Math.min(100, score)))}`;
}
