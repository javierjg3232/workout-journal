import { useColorScheme } from 'react-native';

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

export const lightColors: ThemeColors = {
  background: '#F4F5F7',
  card: '#FFFFFF',
  cardBorder: '#E7E8EC',
  text: '#17181C',
  textSecondary: '#4B4E57',
  textMuted: '#8A8D97',
  primary: '#2F6FED',
  primaryText: '#FFFFFF',
  primarySoft: '#E8EFFD',
  danger: '#D6453D',
  dangerSoft: '#FBEAE9',
  success: '#1F9D55',
  warning: '#B7791F',
  warningSoft: '#FCF3E3',
  inputBackground: '#FFFFFF',
  inputBorder: '#D8DAE0',
  separator: '#ECEDF1',
};

export const darkColors: ThemeColors = {
  background: '#101114',
  card: '#1B1D22',
  cardBorder: '#2A2D34',
  text: '#F2F3F5',
  textSecondary: '#B6B9C2',
  textMuted: '#7C8089',
  primary: '#5B8DF2',
  primaryText: '#FFFFFF',
  primarySoft: '#22304C',
  danger: '#E5675F',
  dangerSoft: '#3C2523',
  success: '#3FBF77',
  warning: '#D9A048',
  warningSoft: '#37301F',
  inputBackground: '#22242B',
  inputBorder: '#383B44',
  separator: '#26282F',
};

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
