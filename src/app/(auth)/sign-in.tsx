import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { showAlert } from '@/lib/alert';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

export default function SignInScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      showAlert('Missing info', 'Enter your email and password.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) showAlert('Sign in failed', error.message);
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={[styles.emoji]}>🏋️</Text>
          <Text style={[styles.title, { color: colors.text }]}>Workout Journal</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Log your workouts, keep your streak alive.
          </Text>

          {!isSupabaseConfigured && (
            <View style={[styles.banner, { backgroundColor: colors.warningSoft }]}>
              <Text style={{ color: colors.warning }}>
                Supabase isn’t configured yet. Copy .env.example to .env, fill in your project URL
                and anon key, then restart the dev server.
              </Text>
            </View>
          )}

          <TextInput
            style={inputStyle}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={inputStyle}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
          />

          <Button title="Sign In" onPress={handleSignIn} loading={submitting} style={styles.button} />

          <Link href="/sign-up" style={styles.link}>
            <Text style={{ color: colors.primary }}>New here? Create an account</Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  emoji: { fontSize: 48, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
  banner: { borderRadius: 12, padding: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: { marginTop: 8 },
  link: { alignSelf: 'center', marginTop: 16, padding: 4 },
});
