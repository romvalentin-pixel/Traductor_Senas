import type { ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  border: string;
  inputBackground: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  shadow: string;
}

export const lightColors: ThemeColors = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF0F8',
  text: '#0F172A',
  textMuted: '#5B6B82',
  primary: '#0E7490',
  primaryPressed: '#155E75',
  onPrimary: '#FFFFFF',
  border: '#D6DFEA',
  inputBackground: '#FFFFFF',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
  overlay: 'rgba(15, 23, 42, 0.72)',
  shadow: '#0F172A',
};

export const darkColors: ThemeColors = {
  background: '#080F1C',
  surface: '#111C2E',
  surfaceAlt: '#18263B',
  text: '#F1F5F9',
  textMuted: '#9BAABF',
  primary: '#22D3EE',
  primaryPressed: '#06B6D4',
  onPrimary: '#042F2E',
  border: '#26364D',
  inputBackground: '#0D1726',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.78)',
  shadow: '#000000',
};

export function resolveColors(
  mode: ThemeMode,
  systemScheme: ColorSchemeName | null
): ThemeColors {
  const dark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  return dark ? darkColors : lightColors;
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
