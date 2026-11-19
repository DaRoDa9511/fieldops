import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState, type ComponentProps } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { BrandGradient } from '@/components/ui/gradient';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Logo } from '@/components/ui/logo';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { en, type TranslationKey } from '@/i18n/translations';
import { useAuth } from '@/providers/auth-provider';
import { useT } from '@/providers/preferences-provider';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES: { icon: ComponentProps<typeof Ionicons>['name']; key: TranslationKey }[] = [
  { icon: 'pulse', key: 'auth.feature1' },
  { icon: 'camera', key: 'auth.feature2' },
  { icon: 'scan', key: 'auth.feature3' },
];

export default function SignInScreen() {
  const theme = useTheme();
  const t = useT();
  const { signIn } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: TranslationKey; password?: TranslationKey }>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    const errors: typeof fieldErrors = {};
    if (!EMAIL_RE.test(email.trim())) errors.email = 'auth.invalidEmail';
    if (password.length < 6) errors.password = 'auth.shortPassword';
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    // On success the auth listener flips the session and the router guard navigates for us.
    if (error) setFormError(error);
  }

  // Auth errors come back as translation keys when we recognise them.
  const formErrorText = formError ? (formError in en ? t(formError as TranslationKey) : formError) : null;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
          {/* Hero */}
          <BrandGradient style={styles.hero}>
            <SafeAreaView edges={['top']} style={styles.heroInner}>
              <View style={styles.heroTop}>
                <Logo size={44} inverted />
                <LanguageToggle />
              </View>
              <View style={styles.heroText}>
                <AppText variant="display" style={styles.white}>
                  {t('auth.tagline')}
                </AppText>
                <View style={styles.features}>
                  {FEATURES.map((f) => (
                    <View key={f.key} style={styles.featureChip}>
                      <Ionicons name={f.icon} size={14} color="#FFFFFF" />
                      <AppText variant="caption" style={styles.white}>
                        {t(f.key)}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            </SafeAreaView>
          </BrandGradient>

          {/* Form sheet */}
          <View style={[styles.sheet, { backgroundColor: theme.background }]}>
            <View style={styles.container}>
              <View style={styles.header}>
                <AppText variant="title">{t('auth.welcome')}</AppText>
                <AppText color="textSecondary">{t('auth.subtitle')}</AppText>
              </View>

              {formErrorText ? (
                <View
                  accessibilityRole="alert"
                  style={[styles.alert, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
                  <Ionicons name="alert-circle" size={20} color={theme.danger} />
                  <AppText variant="caption" color="danger" style={styles.flex}>
                    {formErrorText}
                  </AppText>
                </View>
              ) : null}

              <View style={styles.form}>
                <TextField
                  label={t('auth.email')}
                  icon="mail-outline"
                  placeholder="you@company.com"
                  value={email}
                  onChangeText={setEmail}
                  error={fieldErrors.email ? t(fieldErrors.email) : null}
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
                  label={t('auth.password')}
                  icon="lock-closed-outline"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  error={fieldErrors.password ? t(fieldErrors.password) : null}
                  secureToggle
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  editable={!submitting}
                />
                <Button title={t('auth.signIn')} icon="arrow-forward" loading={submitting} onPress={handleSubmit} />
              </View>

              <View style={styles.footerRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color={theme.textMuted} />
                <AppText variant="caption" color="textMuted" style={styles.footer}>
                  {t('auth.footer')}
                </AppText>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  white: { color: '#FFFFFF' },
  scroll: { flexGrow: 1 },
  hero: { minHeight: 300 },
  heroInner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl + Spacing.lg,
    justifyContent: 'space-between',
    gap: Spacing.xxl,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroText: { gap: Spacing.lg },
  features: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sheet: {
    flex: 1,
    marginTop: -Spacing.xxl,
    borderTopLeftRadius: Radius.xl + 4,
    borderTopRightRadius: Radius.xl + 4,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.xl },
  header: { gap: Spacing.xs },
  form: { gap: Spacing.lg },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs + 2 },
  footer: { textAlign: 'center', flexShrink: 1 },
});
