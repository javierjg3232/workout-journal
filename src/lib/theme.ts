import { useColorScheme } from 'react-native';

import type { MuscleGroup } from './types';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  danger: string;
  dangerSoft: string;
  success: string;
  warning: string;
  warningSoft: string;
  inputBackground: string;
  inputBorder: string;
  separator: string;
}

/** Instagram-style light palette: white, content-forward, hairline separators. */
export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#DBDBDB',
  text: '#262626',
  textSecondary: '#737373',
  textMuted: '#8E8E8E',
  primary: '#0095F6',
  primaryText: '#FFFFFF',
  primarySoft: '#E0F1FF',
  danger: '#ED4956',
  dangerSoft: '#FDECEE',
  success: '#2ECC71',
  warning: '#C77700',
  warningSoft: '#FFF4E3',
  inputBackground: '#FAFAFA',
  inputBorder: '#DBDBDB',
  separator: '#DBDBDB',
};

/** Instagram-style dark palette: pure black. */
export const darkColors: ThemeColors = {
  background: '#000000',
  card: '#000000',
  cardBorder: '#262626',
  text: '#F5F5F5',
  textSecondary: '#A8A8A8',
  textMuted: '#737373',
  primary: '#0095F6',
  primaryText: '#FFFFFF',
  primarySoft: '#0E2A3E',
  danger: '#ED4956',
  dangerSoft: '#2C1215',
  success: '#2ECC71',
  warning: '#E8A33D',
  warningSoft: '#2B2010',
  inputBackground: '#121212',
  inputBorder: '#363636',
  separator: '#262626',
};

/** Flame gradient for the streak ring, red → orange. */
export const streakGradient = ['#ED4956', '#FA7E1E'] as const;

/** Accent color per muscle group, for avatar circles in exercise lists. */
export const muscleGroupColors: Record<MuscleGroup, string> = {
  Chest: '#D62976',
  Back: '#4F5BD5',
  Legs: '#FA7E1E',
  Shoulders: '#962FBF',
  Arms: '#0095F6',
  Core: '#2ECC71',
  Cardio: '#ED4956',
  Other: '#8E8E8E',
};

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
