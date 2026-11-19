import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { fetchDocument, scanDocument, type ScannedDocument } from '@/features/work-orders/api';
import { DocStatusBadge, DocumentSummary } from '@/features/work-orders/document-summary';
import { errorMessage } from '@/hooks/use-query';
import { useTheme } from '@/hooks/use-theme';
import { useT } from '@/providers/preferences-provider';

type Phase =
  | { kind: 'pick' }
  | { kind: 'working'; uri: string; step: 'uploading' | 'reading' }
  | { kind: 'done'; uri: string; doc: ScannedDocument }
  | { kind: 'error'; uri?: string; message: string };

const PREVIEW_HEIGHT = 260;

/** Modal: photograph an invoice → upload → AI extraction → review. */
export default function ScanDocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const t = useT();
  const [phase, setPhase] = useState<Phase>({ kind: 'pick' });

  async function start(source: 'camera' | 'library') {
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setPhase({
        kind: 'error',
        message: t('detail.permission', {
          what: t(source === 'camera' ? 'detail.permissionCamera' : 'detail.permissionLibrary'),
        }),
      });
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const result =
      source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    const asset = result.assets[0];
    setPhase({ kind: 'working', uri: asset.uri, step: 'uploading' });
    try {
      const docId = await scanDocument(id, asset, (step) => setPhase({ kind: 'working', uri: asset.uri, step }));
      const doc = await fetchDocument(docId);
      if (doc.status === 'failed') {
        setPhase({ kind: 'error', uri: asset.uri, message: t('scan.failedMsg') });
      } else {
        setPhase({ kind: 'done', uri: asset.uri, doc });
      }
    } catch (e) {
      setPhase({ kind: 'error', uri: asset.uri, message: errorMessage(e) });
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {phase.kind === 'pick' ? (
          <>
            <View style={[styles.hero, { backgroundColor: theme.primarySoft }]}>
              <View style={[styles.heroIcon, { backgroundColor: theme.primary }]}>
                <Ionicons name="scan" size={34} color="#FFFFFF" />
              </View>
              <AppText variant="heading" style={styles.center}>
                {t('scan.headline')}
              </AppText>
              <AppText color="textSecondary" style={styles.center}>
                {t('scan.subtitle')}
              </AppText>
            </View>
            <Button title={t('scan.takePhoto')} icon="camera" onPress={() => start('camera')} />
            <Button title={t('scan.fromGallery')} icon="images-outline" variant="secondary" onPress={() => start('library')} />
            <View style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={16} color={theme.textMuted} />
              <AppText variant="caption" color="textMuted" style={styles.flex}>
                {t('scan.tip')}
              </AppText>
            </View>
          </>
        ) : null}

        {phase.kind === 'working' ? (
          <>
            <ScanningPreview uri={phase.uri} />
            <Steps step={phase.step} />
          </>
        ) : null}

        {phase.kind === 'done' ? (
          <>
            <View style={styles.doneHeader}>
              <Image source={phase.uri} style={[styles.thumb, { borderColor: theme.border }]} contentFit="cover" />
              <View style={styles.flex}>
                <View style={styles.doneTitle}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  <AppText variant="heading">{t('scan.done')}</AppText>
                </View>
                <DocStatusBadge status={phase.doc.status} />
              </View>
            </View>
            <Card>
              <DocumentSummary doc={phase.doc} />
            </Card>
            <Button title={t('scan.finish')} icon="checkmark" onPress={() => router.back()} />
            <Button title={t('scan.scanAnother')} variant="ghost" icon="scan" onPress={() => setPhase({ kind: 'pick' })} />
          </>
        ) : null}

        {phase.kind === 'error' ? (
          <>
            {phase.uri ? <Image source={phase.uri} style={[styles.preview, { opacity: 0.5 }]} contentFit="cover" /> : null}
            <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
              <Ionicons name="alert-circle" size={22} color={theme.danger} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong" color="danger">
                  {t('scan.failed')}
                </AppText>
                <AppText variant="caption" color="danger">
                  {phase.message}
                </AppText>
              </View>
            </View>
            <Button title={t('common.retry')} icon="refresh" onPress={() => setPhase({ kind: 'pick' })} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Photo with an animated scan line — makes the AI step feel alive. */
function ScanningPreview({ uri }: { uri: string }) {
  const theme = useTheme();
  const [y] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [y]);

  return (
    <View style={styles.previewWrap}>
      <Image source={uri} style={styles.preview} contentFit="cover" />
      <View style={[StyleSheet.absoluteFill, styles.previewTint]} />
      <Animated.View
        style={[
          styles.scanLine,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.primary,
            transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [8, PREVIEW_HEIGHT - 12] }) }],
          },
        ]}
      />
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <View key={c} style={[styles.corner, styles[c], { borderColor: '#FFFFFF' }]} />
      ))}
    </View>
  );
}

function Steps({ step }: { step: 'uploading' | 'reading' }) {
  const theme = useTheme();
  const t = useT();
  const rows = [
    { key: 'uploading', label: t('scan.uploading') },
    { key: 'reading', label: t('scan.reading') },
  ] as const;
  const current = rows.findIndex((r) => r.key === step);
  return (
    <View style={styles.steps}>
      {rows.map((r, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={r.key} style={styles.stepRow}>
            <Ionicons
              name={done ? 'checkmark-circle' : active ? 'ellipse' : 'ellipse-outline'}
              size={20}
              color={done ? theme.success : active ? theme.primary : theme.textMuted}
            />
            <AppText color={active ? 'text' : 'textMuted'} style={active && { fontWeight: '600' }}>
              {r.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const corner = { position: 'absolute' as const, width: 26, height: 26, borderWidth: 3 };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.lg, gap: Spacing.lg },
  hero: { alignItems: 'center', gap: Spacing.sm, padding: Spacing.xl, borderRadius: Radius.lg },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  previewWrap: { height: PREVIEW_HEIGHT, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#0B1220' },
  preview: { width: '100%', height: PREVIEW_HEIGHT, borderRadius: Radius.lg },
  previewTint: { backgroundColor: 'rgba(11,18,32,0.35)' },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 3,
    borderRadius: 2,
    shadowOpacity: 0.9,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  corner,
  tl: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  tr: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  bl: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  br: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  steps: { gap: Spacing.md, paddingHorizontal: Spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  doneHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  doneTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs + 2, marginBottom: Spacing.xs },
  thumb: { width: 64, height: 64, borderRadius: Radius.md, borderWidth: 1 },
  errorBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
