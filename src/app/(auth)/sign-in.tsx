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
import { Wordmark } from '@/components/wordmark';
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
          <Wordmark />
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
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

          <Button title="Log in" onPress={handleSignIn} loading={submitting} style={styles.button} />
        </View>

        <View style={[styles.footer, { borderTopColor: colors.separator }]}>
          <Text style={{ color: colors.textSecondary, fontSize: 14 }}>New here? </Text>
          <Link href="/sign-up">
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
              Create an account
            </Text>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 10 },
  tagline: { fontSize: 14, textAlign: 'center', marginBottom: 22 },
  banner: { borderRadius: 8, padding: 12, marginBottom: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  button: { marginTop: 10 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 18,
  },
});
