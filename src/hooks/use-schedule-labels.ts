import { useMemo } from 'react';

import { useT } from '@/providers/preferences-provider';

/** Translated "Today / Tomorrow / Yesterday" labels for `formatSchedule`. */
export function useScheduleLabels() {
  const t = useT();
  return useMemo(
    () => ({
      today: t('date.today'),
      tomorrow: t('date.tomorrow'),
      yesterday: t('date.yesterday'),
      notScheduled: t('date.notScheduled'),
    }),
    [t],
  );
}
