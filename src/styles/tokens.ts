/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ProFile Centralized Design Tokens
 * Premium, student-focused monochrome cream design system.
 */

export const colors = {
  // Primary Surfaces
  creamBg: '#F8F5EE',       // Primary page background
  surfaceOffWhite: '#F8F8F6', // Main surface for cards, sections
  pureWhite: '#FFFFFF',      // Card highlights, inputs, floating surfaces

  // Dark & Elevated Surfaces
  obsidian: '#101010',       // Primary text, primary black buttons
  charcoal: '#242424',       // Secondary dark surface
  darkElevated: '#1C1C1C',   // Elevated dark containers, contrast panels

  // Typography & Neutrals
  textPrimary: '#101010',    // Obsidian Black
  textSecondary: '#777777',  // Ash Grey
  textMuted: '#A3A3A3',      // Muted metadata, placeholders
  textInverse: '#F8F5EE',    // Cream text on dark buttons/surfaces

  // Borders & Dividers
  borderSoft: '#E5E0D8',     // Soft Ash border for light cards
  borderDark: '#3A3A3A',     // Dark borders for charcoal surfaces
  borderFocus: '#101010',    // Obsidian ring on focus
} as const;

export const semanticColors = {
  background: colors.creamBg,
  surface: colors.surfaceOffWhite,
  surfaceElevated: colors.pureWhite,
  cardBackground: colors.surfaceOffWhite,
  cardHover: colors.pureWhite,
  border: colors.borderSoft,
  borderSubtle: 'rgba(229, 224, 216, 0.6)',
  text: colors.textPrimary,
  textMuted: colors.textSecondary,
  textSubtle: colors.textMuted,
  primaryAction: colors.obsidian,
  primaryActionHover: colors.charcoal,
  primaryActionText: colors.pureWhite,
  secondaryAction: colors.surfaceOffWhite,
  secondaryActionBorder: colors.borderSoft,
  secondaryActionText: colors.textPrimary,
} as const;

export const typography = {
  fontFamily: {
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'IBM Plex Mono', monospace",
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  sizes: {
    xs: { fontSize: '0.75rem', lineHeight: '1rem' },         // 12px
    sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },     // 14px
    base: { fontSize: '1rem', lineHeight: '1.5rem' },        // 16px
    lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },     // 18px
    xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },      // 20px
    '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },       // 24px
    '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },  // 30px
    '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' },    // 36px
    '5xl': { fontSize: '3rem', lineHeight: '1.16' },         // 48px
  },
} as const;

export const spacing = {
  containerPaddingMobile: '1rem',    // 16px
  containerPaddingTablet: '1.5rem',  // 24px
  containerPaddingDesktop: '2.5rem', // 40px
  cardPaddingMobile: '1.25rem',      // 20px
  cardPaddingDesktop: '2rem',        // 32px
  sectionGap: '3rem',                // 48px
} as const;

export const radii = {
  none: '0px',
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.25rem',// 20px
  '3xl': '1.75rem',// 28px
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  card: '0 1px 3px rgba(16, 16, 16, 0.04), 0 4px 16px rgba(16, 16, 16, 0.02)',
  cardHover: '0 8px 24px rgba(16, 16, 16, 0.06), 0 2px 6px rgba(16, 16, 16, 0.03)',
  elevated: '0 12px 36px rgba(16, 16, 16, 0.08)',
  dialog: '0 20px 48px rgba(16, 16, 16, 0.12)',
} as const;

export const layout = {
  maxContainerWidth: '1280px',
  readableMeasure: '68ch',
  topBarHeight: '72px',
  mobileBottomNavHeight: '64px',
} as const;

export const buttonSizes = {
  sm: {
    height: '2.25rem', // 36px
    padding: '0.5rem 0.875rem',
    fontSize: '0.8125rem',
  },
  md: {
    height: '2.75rem', // 44px (touch-friendly)
    padding: '0.625rem 1.25rem',
    fontSize: '0.875rem',
  },
  lg: {
    height: '3.25rem', // 52px
    padding: '0.75rem 1.75rem',
    fontSize: '1rem',
  },
} as const;

export const inputHeights = {
  sm: '2.25rem', // 36px
  md: '2.75rem', // 44px (touch-friendly standard)
  lg: '3.25rem', // 52px
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
  standard: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
  smooth: '300ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const;
