import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { completeWorkOrder, fetchWorkOrder } from '@/features/work-orders/api';
import { SignaturePad, type SignaturePadHandle } from '@/features/work-orders/signature-pad';
import { errorMessage, useQuery } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/lib/format';
import { useT } from '@/providers/preferences-provider';

/** Modal: technician notes + customer signature → marks the order as completed. */
export default function CompleteWorkOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const t = useT();
  const pad = useRef<SignaturePadHandle>(null);

  const order = useQuery(() => fetchWorkOrder(id), [id]);
  const [notes, setNotes] = useState<string | null>(null); // null = not edited yet → prefill
  const [hasSignature, setHasSignature] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const o = order.data;
  const notesValue = notes ?? o?.technician_notes ?? '';

  async function handleComplete() {
    if (!pad.current || pad.current.isEmpty()) {
      setError(t('complete.needSignature'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await completeWorkOrder(id, { signatureSvg: pad.current.toSvg(), notes: notesValue });
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.flex, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          scrollEnabled={!drawing}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}>
          {o ? (
            <View style={[styles.summary, { backgroundColor: theme.successSoft }]}>
              <Ionicons name="checkmark-circle" size={22} color={theme.success} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{o.title}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {o.customer?.name}
                  {o.started_at ? ` · ${t('complete.onSite', { duration: formatDuration(o.started_at) })}` : ''}
                </AppText>
              </View>
            </View>
          ) : null}

          <TextField
            label={t('complete.notes')}
            placeholder={t('complete.notesPlaceholder')}
            value={notesValue}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.notes}
            textAlignVertical="top"
          />

          <Card title={t('complete.signature')}>
            <SignaturePad ref={pad} onDrawingChange={setDrawing} onChange={setHasSignature} />
            <View style={styles.signatureFooter}>
              <AppText variant="caption" color="textMuted" style={styles.flex}>
                {t('complete.confirm')}
              </AppText>
              <Button
                title={t('complete.clear')}
                variant="ghost"
                fullWidth={false}
                disabled={!hasSignature}
                onPress={() => pad.current?.clear()}
              />
            </View>
          </Card>

          {error ? (
            <View style={[styles.alert, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
              <Ionicons name="alert-circle" size={18} color={theme.danger} />
              <AppText variant="caption" color="danger" style={styles.flex}>
                {error}
              </AppText>
            </View>
          ) : null}

          <Button
            title={t('complete.title')}
            icon="checkmark-done"
            loading={submitting}
            disabled={!hasSignature}
            onPress={handleComplete}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  notes: { minHeight: 96 },
  signatureFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
