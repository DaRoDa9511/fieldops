import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { Linking, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { PriorityBadge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/state-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  fetchDocuments,
  fetchPhotos,
  fetchWorkOrder,
  getSignedUrl,
  startWorkOrder,
  uploadPhoto,
  type Customer,
} from '@/features/work-orders/api';
import { DocStatusBadge } from '@/features/work-orders/document-summary';
import { PhotoGrid } from '@/features/work-orders/photo-grid';
import { errorMessage, useQuery } from '@/hooks/use-query';
import { useScheduleLabels } from '@/hooks/use-schedule-labels';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration, formatMoney, formatSchedule, formatTime } from '@/lib/format';
import { useT } from '@/providers/preferences-provider';

export default function WorkOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const t = useT();
  const labels = useScheduleLabels();

  const order = useQuery(() => fetchWorkOrder(id), [id]);
  const photos = useQuery(() => fetchPhotos(id), [id]);
  const docs = useQuery(() => fetchDocuments(id), [id]);
  const signatureUrl = useQuery(
    async () => (order.data?.signature_path ? getSignedUrl('signatures', order.data.signature_path) : null),
    [order.data?.signature_path],
  );

  const [actionError, setActionError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [uploading, setUploading] = useState(0);

  // Refresh after returning from the "Complete job" / "Scan invoice" modals.
  const { reload: reloadOrder } = order;
  const { reload: reloadDocs } = docs;
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reloadOrder();
      reloadDocs();
    }, [reloadOrder, reloadDocs]),
  );

  async function handleStart() {
    setActionError(null);
    setStarting(true);
    try {
      order.setData(await startWorkOrder(id));
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setStarting(false);
    }
  }

  async function handleAddPhoto(source: 'camera' | 'library') {
    setActionError(null);
    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setActionError(
        t('detail.permission', {
          what: t(source === 'camera' ? 'detail.permissionCamera' : 'detail.permissionLibrary'),
        }),
      );
      return;
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 0.6, // ~300–600 KB per photo: good enough for evidence, cheap on mobile data
      allowsMultipleSelection: source === 'library',
      selectionLimit: 6,
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    setUploading(result.assets.length);
    try {
      for (const asset of result.assets) {
        await uploadPhoto(id, asset);
        setUploading((n) => n - 1);
      }
    } catch (e) {
      setActionError(t('detail.uploadFailed', { error: errorMessage(e) }));
    } finally {
      setUploading(0);
      photos.reload();
    }
  }

  const o = order.data;

  if (order.status === 'loading') return <DetailSkeleton />;
  if (order.status === 'error' || !o) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
        <ErrorState message={order.error ?? t('detail.notFound')} onRetry={order.retry} />
      </SafeAreaView>
    );
  }

  const canEdit = o.status === 'pending' || o.status === 'in_progress';

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: o.code }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={order.refreshing}
            onRefresh={() => {
              order.refresh();
              photos.reload();
            }}
            tintColor={theme.primary}
          />
        }>
        {/* Title */}
        <View style={styles.titleBlock}>
          <View style={styles.badges}>
            <StatusBadge status={o.status} />
            <PriorityBadge priority={o.priority} />
          </View>
          <AppText variant="title">{o.title}</AppText>
        </View>

        {actionError ? (
          <View style={[styles.alert, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
            <Ionicons name="alert-circle" size={18} color={theme.danger} />
            <AppText variant="caption" color="danger" style={styles.flex}>
              {actionError}
            </AppText>
          </View>
        ) : null}

        {/* Timeline */}
        <Card title={t('detail.schedule')}>
          <InfoRow icon="calendar-outline" label={t('detail.scheduled')} value={formatSchedule(o.scheduled_for, labels)} />
          {o.started_at ? <InfoRow icon="play-circle-outline" label={t('detail.started')} value={formatTime(o.started_at)} /> : null}
          {o.completed_at ? (
            <InfoRow icon="checkmark-circle-outline" label={t('detail.completed')} value={formatTime(o.completed_at)} />
          ) : null}
          {o.started_at && o.status !== 'cancelled' ? (
            <InfoRow
              icon="stopwatch-outline"
              label={o.completed_at ? t('detail.timeOnSite') : t('detail.elapsed')}
              value={formatDuration(o.started_at, o.completed_at)}
            />
          ) : null}
        </Card>

        {o.customer ? <CustomerCard customer={o.customer} /> : null}

        {o.description ? (
          <Card title={t('detail.description')}>
            <AppText>{o.description}</AppText>
          </Card>
        ) : null}

        {/* Photos */}
        <Card title={`${t('detail.photos')}${photos.data?.length ? ` (${photos.data.length})` : ''}`}>
          <PhotoGrid photos={photos.data ?? []} uploading={uploading} loading={photos.status === 'loading'} />
          {photos.status === 'error' ? (
            <AppText variant="caption" color="danger">
              {t('detail.photosError')}
            </AppText>
          ) : null}
          {canEdit ? (
            <View style={styles.row}>
              <Button
                title={t('detail.camera')}
                icon="camera-outline"
                variant="secondary"
                style={styles.flex}
                disabled={uploading > 0}
                onPress={() => handleAddPhoto('camera')}
              />
              <Button
                title={t('detail.gallery')}
                icon="images-outline"
                variant="secondary"
                style={styles.flex}
                disabled={uploading > 0}
                onPress={() => handleAddPhoto('library')}
              />
            </View>
          ) : null}
        </Card>

        {/* AI-scanned supplier documents */}
        <Card title={`${t('detail.documents')}${docs.data?.length ? ` (${docs.data.length})` : ''}`}>
          {docs.status === 'loading' ? (
            <Skeleton height={56} radius={Radius.md} />
          ) : docs.data?.length ? (
            docs.data.map((d) => (
              <View key={d.id} style={[styles.docRow, { borderColor: theme.border }]}>
                <View style={[styles.docIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong" numberOfLines={1}>
                    {d.vendor_name ?? t(`doc.${d.status}`)}
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    {d.invoice_number ? `#${d.invoice_number} · ` : ''}
                    {formatMoney(d.total_amount, d.currency ?? 'USD')}
                  </AppText>
                </View>
                <DocStatusBadge status={d.status} />
              </View>
            ))
          ) : (
            <AppText variant="caption" color="textMuted">
              {t('detail.noDocuments')}
            </AppText>
          )}
          {canEdit ? (
            <Button
              title={t('detail.scanInvoice')}
              icon="scan"
              variant="secondary"
              onPress={() => router.push({ pathname: '/orders/[id]/scan', params: { id } })}
            />
          ) : null}
        </Card>

        {o.technician_notes ? (
          <Card title={t('detail.notes')}>
            <AppText>{o.technician_notes}</AppText>
          </Card>
        ) : null}

        {o.status === 'completed' ? (
          <Card title={t('detail.signature')}>
            {signatureUrl.data ? (
              <Image source={signatureUrl.data} style={styles.signature} contentFit="contain" />
            ) : o.signature_path ? (
              <Skeleton height={140} radius={Radius.md} />
            ) : (
              <AppText color="textMuted">{t('detail.noSignature')}</AppText>
            )}
          </Card>
        ) : null}
      </ScrollView>

      {/* Sticky primary action — the status flow */}
      {canEdit ? (
        <SafeAreaView edges={['bottom']} style={[styles.actionBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.actionInner}>
            {o.status === 'pending' ? (
              <Button title={t('detail.startJob')} icon="play" loading={starting} onPress={handleStart} />
            ) : (
              <Button
                title={t('detail.completeJob')}
                icon="checkmark-circle"
                onPress={() => router.push({ pathname: '/orders/[id]/complete', params: { id } })}
              />
            )}
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color={theme.textSecondary} />
      <AppText color="textSecondary" style={styles.flex}>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  const theme = useTheme();
  const t = useT();

  function openMaps() {
    const hasCoords = customer.latitude != null && customer.longitude != null;
    const query = hasCoords ? `${customer.latitude},${customer.longitude}` : customer.address ?? customer.name;
    const encoded = encodeURIComponent(query);
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${encoded}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    Linking.openURL(url);
  }

  return (
    <Card title={t('detail.customer')}>
      <View style={styles.customerHead}>
        <View style={[styles.customerIcon, { backgroundColor: theme.primarySoft }]}>
          <Ionicons name="business" size={20} color={theme.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{customer.name}</AppText>
          {customer.address ? (
            <AppText variant="caption" color="textSecondary">
              {customer.address}
            </AppText>
          ) : null}
        </View>
      </View>
      <View style={styles.row}>
        <Button title={t('detail.directions')} icon="navigate-outline" variant="secondary" style={styles.flex} onPress={openMaps} />
        {customer.phone ? (
          <Button
            title={t('detail.call')}
            icon="call-outline"
            variant="secondary"
            style={styles.flex}
            onPress={() => Linking.openURL(`tel:${customer.phone!.replace(/[^\d+]/g, '')}`)}
          />
        ) : null}
      </View>
    </Card>
  );
}

function DetailSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.badges}>
          <Skeleton width={90} height={20} radius={Radius.pill} />
          <Skeleton width={70} height={20} radius={Radius.pill} />
        </View>
        <Skeleton width="80%" height={28} />
        {[120, 150, 110].map((h, i) => (
          <Skeleton key={i} height={h} radius={Radius.lg} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
    gap: Spacing.lg,
  },
  titleBlock: { gap: Spacing.sm },
  badges: { flexDirection: 'row', gap: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  customerHead: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  customerIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  docIcon: { width: 36, height: 36, borderRadius: Radius.sm + 2, alignItems: 'center', justifyContent: 'center' },
  signature: { height: 160, borderRadius: Radius.md, backgroundColor: '#FFFFFF' },
  actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1 },
  actionInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
