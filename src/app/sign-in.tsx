import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/providers/auth-provider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const theme = useTheme();
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    const errors: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    // On success the auth listener flips the session and the router guard navigates for us.
    if (error) setFormError(error);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            <View style={styles.header}>
              <Logo />
              <AppText variant="title" style={styles.headline}>
                Welcome back
              </AppText>
              <AppText color="textSecondary">
                Sign in to see today&apos;s work orders and update jobs from the field.
              </AppText>
            </View>

            {formError ? (
              <View
                accessibilityRole="alert"
                style={[styles.alert, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
                <Ionicons name="alert-circle" size={20} color={theme.danger} />
                <AppText variant="caption" color="danger" style={styles.flex}>
                  {formError}
                </AppText>
              </View>
            ) : null}

            <View style={styles.form}>
              <TextField
                label="Email"
                icon="mail-outline"
                placeholder="you@company.com"
                value={email}
                onChangeText={setEmail}
                error={fieldErrors.email}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                editable={!submitting}
              />
              <TextField
                ref={passwordRef}
                label="Password"
                icon="lock-closed-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                error={fieldErrors.password}
                secureToggle
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleSubmit}
                editable={!submitting}
              />
              <Button title="Sign in" icon="log-in-outline" loading={submitting} onPress={handleSubmit} />
            </View>

            <AppText variant="caption" color="textMuted" style={styles.footer}>
              Accounts are created by your dispatcher in the FieldOps admin panel.
            </AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.xl },
  header: { gap: Spacing.sm },
  headline: { marginTop: Spacing.lg },
  form: { gap: Spacing.lg },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  footer: { textAlign: 'center' },
});
