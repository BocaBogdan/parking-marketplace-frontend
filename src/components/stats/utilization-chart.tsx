import { useTranslation } from 'react-i18next'
import { StatsTable } from '@/components/stats/chart-card'
import { formatHours } from '@/lib/format'
import { utilizationOf } from '@/lib/stats'
import type { BuildingStats } from '@/types/models'

type Row = BuildingStats['utilization'][number]

/** Most used first; spots without hours last */
function sorted(rows: Row[]) {
  return [...rows].sort((a, b) => (utilizationOf(b) ?? -1) - (utilizationOf(a) ?? -1))
}

function useText() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const percent = new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 })
  return {
    percent: (row: Row) => {
      const share = utilizationOf(row)
      return share === undefined ? t('stats.utilization.noHours') : percent.format(share)
    },
    detail: (row: Row) =>
      t('stats.utilization.detail', {
        booked: formatHours(row.bookedMinutes, language),
        offered: formatHours(row.offeredMinutes, language),
      }),
    hours: (minutes: number) => formatHours(minutes, language),
  }
}

/** One meter per spot: how much of the time its owner offers is actually booked */
export function UtilizationChart({ rows }: { rows: Row[] }) {
  const { t } = useTranslation()
  const text = useText()

  return (
    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-x-8">
      {sorted(rows).map((row) => {
        const share = utilizationOf(row)
        return (
          <li key={row.spotId} className="grid gap-1.5" title={text.detail(row)}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-semibold">{t('spots.name', { number: row.number })}</span>
              <span className="text-muted-foreground tabular-nums">
                {share === undefined
                  ? text.percent(row)
                  : `${text.percent(row)} · ${text.detail(row)}`}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-primary-100 dark:bg-primary-950">
              <div
                className="h-full rounded-full bg-chart-1"
                style={{ width: `${(share ?? 0) * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function UtilizationTable({ rows }: { rows: Row[] }) {
  const { t } = useTranslation()
  const text = useText()
  return (
    <StatsTable
      head={[
        t('stats.table.spot'),
        t('stats.table.utilization'),
        t('stats.table.booked'),
        t('stats.table.offered'),
      ]}
      numericFrom={1}
      rows={sorted(rows).map((row) => ({
        key: row.spotId,
        cells: [
          t('spots.name', { number: row.number }),
          text.percent(row),
          text.hours(row.bookedMinutes),
          text.hours(row.offeredMinutes),
        ],
      }))}
    />
  )
}
