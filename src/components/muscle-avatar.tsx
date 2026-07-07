import { StyleSheet, Text, View } from 'react-native';

import { muscleGroupColors } from '@/lib/theme';
import type { MuscleGroup } from '@/lib/types';

interface MuscleAvatarProps {
  group: MuscleGroup;
  size?: number;
}

/** Circular avatar with the muscle group's accent color and initial letter. */
export function MuscleAvatar({ group, size = 40 }: MuscleAvatarProps) {
  const color = muscleGroupColors[group] ?? muscleGroupColors.Other;
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}22`,
          borderColor: color,
        },
      ]}
    >
      <Text style={[styles.initial, { color, fontSize: size * 0.4 }]}>{group[0]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  initial: {
    fontWeight: '700',
  },
});
