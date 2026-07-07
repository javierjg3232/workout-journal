import { Link, router } from 'expo-router';
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
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';

export default function SignUpScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password) {
      showAlert('Missing info', 'Enter an email and password.');
      return;
    }
    if (password.length < 6) {
      showAlert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      showAlert('Passwords don’t match', 'Re-enter your password to confirm.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setSubmitting(false);
    if (error) {
      showAlert('Sign up failed', error.message);
      return;
    }
    // With email confirmation enabled in Supabase, no session is returned yet.
    if (!data.session) {
      showAlert('Confirm your email', 'Check your inbox for a confirmation link, then sign in.');
      router.back();
    }
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
          <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your journal syncs to the cloud and follows you across devices.
          </Text>

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
            placeholder="Password (6+ characters)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoComplete="new-password"
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={inputStyle}
            placeholder="Confirm password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoComplete="new-password"
            value={confirm}
            onChangeText={setConfirm}
          />

          <Button title="Sign Up" onPress={handleSignUp} loading={submitting} style={styles.button} />

          <Link href="/sign-in" style={styles.link}>
            <Text style={{ color: colors.primary }}>Already have an account? Sign in</Text>
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
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 16 },
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
