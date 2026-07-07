import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { confirmAction, showAlert } from '@/lib/alert';
import { useAuth } from '@/context/auth';
import { fetchProfile, updateProfile } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import type { WeightUnit } from '@/lib/types';

const REST_DAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [restDays, setRestDays] = useState<number | null>(null);
  const [unit, setUnit] = useState<WeightUnit>('lb');

  useEffect(() => {
    fetchProfile()
      .then((profile) => {
        setRestDays(profile.rest_days_per_week);
        setUnit(profile.preferred_unit);
      })
      .catch(() => showAlert('Error', 'Could not load your settings.'));
  }, []);

  async function changeRestDays(value: number) {
    const previous = restDays;
    setRestDays(value);
    try {
      await updateProfile({ rest_days_per_week: value });
    } catch {
      setRestDays(previous);
      showAlert('Error', 'Could not save. Try again.');
    }
  }

  async function changeUnit(value: WeightUnit) {
    const previous = unit;
    setUnit(value);
    try {
      await updateProfile({ preferred_unit: value });
    } catch {
      setUnit(previous);
      showAlert('Error', 'Could not save. Try again.');
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Planned rest days per week</Text>
        <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
          Your streak survives up to this many skipped days in any rolling week.
        </Text>
        <View style={styles.chips}>
          {REST_DAY_OPTIONS.map((value) => {
            const selected = restDays === value;
            return (
              <Pressable
                key={value}
                onPress={() => changeRestDays(value)}
                disabled={restDays === null}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.inputBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.primaryText : colors.text,
                    fontWeight: selected ? '700' : '400',
                  }}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Default weight unit</Text>
        <View style={styles.chips}>
          {(['lb', 'kg'] as const).map((value) => {
            const selected = unit === value;
            return (
              <Pressable
                key={value}
                onPress={() => changeUnit(value)}
                style={[
                  styles.chip,
                  styles.unitChip,
                  {
                    backgroundColor: selected ? colors.primary : colors.card,
                    borderColor: selected ? colors.primary : colors.inputBorder,
                  },
                ]}
              >
                <Text
                  style={{
                    color: selected ? colors.primaryText : colors.text,
                    fontWeight: selected ? '700' : '400',
                  }}
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Account</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>
          {session?.user.email ?? ''}
        </Text>
        <Button
          title="Sign Out"
          variant="destructive"
          onPress={() =>
            confirmAction({
              title: 'Sign out?',
              message: 'Your data stays safely in the cloud.',
              confirmText: 'Sign Out',
              destructive: true,
              onConfirm: () => supabase.auth.signOut(),
            })
          }
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  card: { gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardHint: { fontSize: 13, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    minWidth: 42,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  unitChip: { minWidth: 56 },
  email: { fontSize: 14, marginBottom: 4 },
});
