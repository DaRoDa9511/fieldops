import { useMemo } from 'react'

import { useT } from '@/i18n/I18nProvider'

/** Translated day labels for `formatSchedule`. */
export function useDayLabels() {
  const t = useT()
  return useMemo(
    () => ({ today: t('date.today'), tomorrow: t('date.tomorrow'), yesterday: t('date.yesterday'), notScheduled: t('date.notScheduled') }),
    [t],
  )
}
