/**
 * NLU YOUTH 2026 - DESIGN SYSTEM TOKENS
 * Trường Đại học Nông Lâm TP. Hồ Chí Minh
 *
 * Cohesive design tokens for colors (NLU green palette, brand accents, neutrals, semantics),
 * spacing scale, typography scale, shadows, radiuses, and elevation transitions.
 */

export const colors = {
  // Primary NLU Forest & Emerald Greens
  nlu: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669', // NLU standard bright brand green
    700: '#047857', // NLU signature primary green
    800: '#065f46', // NLU deep forest green
    900: '#064e3b', // NLU dark header / institutional green
    950: '#022c22', // NLU darkest night / contrast baseline
  },
  // NLU Gold / Agricultural Harvest Accent (Đoàn - Hội)
  gold: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  // Youth Blue (Đoàn Thanh Niên Việt Nam standard cyan-blue)
  youth: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Clean neutral slate palette for high clarity & readability
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Semantic operational indicators
  semantic: {
    success: {
      light: '#ecfdf5',
      base: '#10b981',
      dark: '#047857',
      text: '#065f46',
    },
    warning: {
      light: '#fffbeb',
      base: '#f59e0b',
      dark: '#b45309',
      text: '#92400e',
    },
    error: {
      light: '#fef2f2',
      base: '#ef4444',
      dark: '#b91c1c',
      text: '#991b1b',
    },
    info: {
      light: '#eff6ff',
      base: '#3b82f6',
      dark: '#1d4ed8',
      text: '#1e40af',
    },
  },
} as const;

export const spacing = {
  none: '0px',
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '2rem',    // 32px
  '4xl': '2.5rem',  // 40px
  '5xl': '3rem',    // 48px
  '6xl': '4rem',    // 64px
} as const;

export const typography = {
  fontFamily: {
    sans: [
      'Plus Jakarta Sans',
      'Inter',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(', '),
    mono: [
      'JetBrains Mono',
      'ui-monospace',
      'SFMono-Regular',
      'Menlo',
      'Monaco',
      'Consolas',
      'monospace',
    ].join(', '),
  },
  fontSize: {
    '2xs': ['0.6875rem', { lineHeight: '0.875rem' }], // 11px
    xs: ['0.75rem', { lineHeight: '1rem' }],           // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],       // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],          // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],       // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],        // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],         // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],    // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],      // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
  // Brand green glowing shadows for active tabs, CTAs, hero badges
  nluGlowSm: '0 2px 10px -1px rgba(4, 120, 87, 0.25)',
  nluGlow: '0 8px 24px -4px rgba(4, 120, 87, 0.32)',
  nluGlowLg: '0 12px 32px -4px rgba(4, 120, 87, 0.45)',
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
  cardHover: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 6px 12px -4px rgba(0, 0, 0, 0.04)',
} as const;

export const radius = {
  none: '0px',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const designTokens = {
  colors,
  spacing,
  typography,
  shadows,
  radius,
} as const;

export type DesignTokens = typeof designTokens;
export default designTokens;
