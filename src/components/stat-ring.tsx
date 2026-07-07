import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/lib/theme';

interface StatRingProps {
  value: number;
  label: string;
  /** Colored ring when true, gray "seen story" ring when false. */
  active: boolean;
  /** Ring color when active. */
  color: string;
  labelColor?: string;
  size?: number;
}

/** Instagram-story-style stat: a number inside a colored (or gray) ring, caption below. */
export function StatRing({ value, label, active, color, labelColor, size = 72 }: StatRingProps) {
  const { colors } = useTheme();
  const ringWidth = 3;
  const gap = 3;
  const innerSize = size - (ringWidth + gap) * 2;

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: active ? color : colors.separator,
          },
        ]}
      >
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
      </View>
      <Text style={[styles.label, { color: labelColor ?? colors.textSecondary }]}>{label}</Text>
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
