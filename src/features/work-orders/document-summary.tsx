import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Badge } from '@/components/ui/badge';
import { Radius, Spacing } from '@/constants/theme';
import type { LineItem, ScannedDocument } from '@/features/work-orders/api';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/format';
import { useT } from '@/providers/preferences-provider';

export const DOC_STATUS_COLOR: Record<ScannedDocument['status'], string> = {
  processing: '#2F6BFF',
  extracted: '#7A5AF8',
  verified: '#12B76A',
  failed: '#F04438',
};

export function isDemoDocument(doc: ScannedDocument) {
  const raw = doc.ai_raw as { mode?: string } | null;
  return raw?.mode === 'demo';
}

/** Full extraction result: header fields, line items and totals. */
export function DocumentSummary({ doc }: { doc: ScannedDocument }) {
  const theme = useTheme();
  const t = useT();
  const currency = doc.currency ?? 'USD';
  const items = (Array.isArray(doc.line_items) ? doc.line_items : []) as LineItem[];

  return (
    <View style={styles.wrap}>
      {isDemoDocument(doc) ? (
        <View style={[styles.demo, { backgroundColor: theme.warningSoft }]}>
          <Ionicons name="flask-outline" size={14} color={theme.warning} />
          <AppText variant="caption" style={{ color: theme.warning, fontWeight: '600' }}>
            {t('scan.demo')}
          </AppText>
        </View>
      ) : null}

      <View style={styles.fields}>
        <Field label={t('scan.vendor')} value={doc.vendor_name ?? '—'} wide />
        <Field label={t('scan.invoiceNo')} value={doc.invoice_number ?? '—'} />
        <Field label={t('scan.date')} value={doc.invoice_date ?? '—'} />
      </View>

      <View style={[styles.items, { borderColor: theme.border }]}>
        <AppText variant="overline" color="textSecondary">
          {t('scan.items').toUpperCase()}
        </AppText>
        {items.map((it, i) => (
          <View key={i} style={[styles.itemRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
            <View style={styles.flex}>
              <AppText variant="caption" numberOfLines={2} style={{ color: theme.text, fontWeight: '600' }}>
                {it.description ?? '—'}
              </AppText>
              <AppText variant="caption" color="textMuted">
                {it.quantity ?? '—'} × {formatMoney(it.unit_price, currency)}
              </AppText>
            </View>
            <AppText variant="caption" style={{ color: theme.text, fontWeight: '700' }}>
              {formatMoney(it.amount, currency)}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.totals}>
        <TotalRow label={t('scan.subtotal')} value={formatMoney(doc.subtotal, currency)} />
        <TotalRow label={t('scan.tax')} value={formatMoney(doc.tax, currency)} />
        <View style={[styles.totalStrong, { backgroundColor: theme.primarySoft }]}>
          <AppText variant="bodyStrong" color="primary">
            {t('scan.total')}
          </AppText>
          <AppText variant="heading" color="primary">
            {formatMoney(doc.total_amount, currency)}
          </AppText>
        </View>
        {doc.confidence != null ? (
          <View style={styles.confRow}>
            <AppText variant="caption" color="textSecondary">
              {t('scan.confidence')}
            </AppText>
            <View style={[styles.confTrack, { backgroundColor: theme.surfaceMuted }]}>
              <View
                style={[styles.confFill, { width: `${Math.round(Number(doc.confidence) * 100)}%`, backgroundColor: theme.success }]}
              />
            </View>
            <AppText variant="caption" style={{ color: theme.success, fontWeight: '700' }}>
              {Math.round(Number(doc.confidence) * 100)}%
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function DocStatusBadge({ status }: { status: ScannedDocument['status'] }) {
  const t = useT();
  return <Badge label={t(`doc.${status}`)} color={DOC_STATUS_COLOR[status]} />;
}

function Field({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <View style={[styles.field, wide && styles.fieldWide]}>
      <AppText variant="caption" color="textMuted">
        {label}
      </AppText>
      <AppText variant="bodyStrong" numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <AppText color="textSecondary">{label}</AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg },
  flex: { flex: 1 },
  demo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  fields: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.md },
  field: { width: '50%', gap: 2, paddingRight: Spacing.sm },
  fieldWide: { width: '100%' },
  items: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.sm },
  totals: { gap: Spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalStrong: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  confRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  confTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  confFill: { height: 6, borderRadius: 3 },
});
