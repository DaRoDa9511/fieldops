import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Skeleton } from '@/components/ui/skeleton';
import { Radius, Spacing } from '@/constants/theme';
import type { WorkOrderPhoto } from '@/features/work-orders/api';
import { useTheme } from '@/hooks/use-theme';

const TILE = 96;

type Props = {
  photos: WorkOrderPhoto[];
  uploading: number;
  loading: boolean;
};

/** Thumbnail grid with tap-to-preview. Uploading photos render as skeleton tiles. */
export function PhotoGrid({ photos, uploading, loading }: Props) {
  const theme = useTheme();
  const [preview, setPreview] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.grid}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} width={TILE} height={TILE} radius={Radius.md} />
        ))}
      </View>
    );
  }

  if (!photos.length && !uploading) {
    return (
      <View style={[styles.empty, { borderColor: theme.border }]}>
        <Ionicons name="images-outline" size={22} color={theme.textMuted} />
        <AppText variant="caption" color="textMuted">
          No photos yet — add before/after shots of the job.
        </AppText>
      </View>
    );
  }

  return (
    <>
      <View style={styles.grid}>
        {photos.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="imagebutton"
            accessibilityLabel="Open photo"
            onPress={() => p.url && setPreview(p.url)}>
            <Image
              source={p.url ?? undefined}
              style={[styles.tile, { backgroundColor: theme.surfaceMuted }]}
              contentFit="cover"
              transition={200}
            />
          </Pressable>
        ))}
        {Array.from({ length: uploading }).map((_, i) => (
          <Skeleton key={`up-${i}`} width={TILE} height={TILE} radius={Radius.md} />
        ))}
      </View>

      <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
        <SafeAreaView style={styles.viewer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            hitSlop={16}
            style={styles.close}
            onPress={() => setPreview(null)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          {preview ? <Image source={preview} style={styles.full} contentFit="contain" /> : null}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: { width: TILE, height: TILE, borderRadius: Radius.md },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  close: { alignSelf: 'flex-end', padding: Spacing.lg },
  full: { flex: 1 },
});
