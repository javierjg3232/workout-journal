import { Platform, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/lib/theme';

/** Serif-italic app wordmark, echoing Instagram's script logo. */
export function Wordmark({ size = 34 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.wordmark, { color: colors.text, fontSize: size }]}>Workout Journal</Text>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
    fontStyle: 'italic',
    fontWeight: '700',
    textAlign: 'center',
  },
});
