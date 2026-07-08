import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface StatRingProps {
  value: number;
  label: string;
  /** Colored ring when true, gray "seen story" ring when false. */
  active: boolean;
  /** Ring color when active. */
  color: string;
  /** Gradient ring colors; overrides `color` when active. */
  gradient?: readonly [string, string, ...string[]];
  size?: number;
}

/** Instagram-story-style stat: a number inside a colored (or gray) ring, caption below. */
export function StatRing({ value, label, active, color, gradient, size = 72 }: StatRingProps) {
  const { colors } = useTheme();
  const ringWidth = 3;
  const gap = 3;
  const innerSize = size - (ringWidth + gap) * 2;

  const ringShape = { width: size, height: size, borderRadius: size / 2 };
  const inner = (
    <View
      style={[
        styles.inner,
        {
          width: innerSize,
          height: innerSize,
          borderRadius: innerSize / 2,
          backgroundColor: colors.background,
        },
      ]}
    >
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.wrap}>
      {active && gradient ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={[styles.ring, ringShape]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={[styles.ring, ringShape, { backgroundColor: active ? color : colors.separator }]}
        >
          {inner}
        </View>
      )}
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  ring: { alignItems: 'center', justifyContent: 'center' },
  inner: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 22, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '600' },
});
