import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StatsTable } from '@/components/stats/chart-card'
import { DAYS, displayTime, weekdayName, type DayOfWeek } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import type { StatsHeatmapCell } from '@/types/models'

/**
 * Sequential ramp, one hue: empty cells are neutral, then four primary steps relative to
 * the busiest cell. Validated with the dataviz palette script for light (400→900 on
 * white) and dark (800→200 on the dark card, flipped so the faint end sits near the surface).
 */
const LEVELS = [
  'bg-muted',
  'bg-primary-400 dark:bg-primary-800',
  'bg-primary-500 dark:bg-primary-600',
  'bg-primary-700 dark:bg-primary-400',
  'bg-primary-900 dark:bg-primary-200',
]

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const LABELED_HOURS = new Set([0, 6, 12, 18])

interface HeatmapProps {
  cells: StatsHeatmapCell[]
  /** One spot: a cell's value is the share of that hour it was booked, shown as % */
  asShare?: boolean
}

function useCellText(asShare: boolean) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const percent = new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 0 })
  const decimal = new Intl.NumberFormat(language, { maximumFractionDigits: 1 })
  const day = (cell: StatsHeatmapCell) =>
    weekdayName(cell.dayOfWeek as DayOfWeek, language, 'short')
  const value = (cell: StatsHeatmapCell) =>
    asShare
      ? t('stats.heatmap.bookedShare', { value: percent.format(cell.avgSpotsInUse) })
      : t('stats.heatmap.inUse', { value: decimal.format(cell.avgSpotsInUse) })
  return { day, value, hour: (cell: StatsHeatmapCell) => displayTime(cell.hour * 60) }
}

/** Weekday × hour grid of how busy spots are, in Bucharest time */
export function BusyHoursHeatmap({ cells, asShare = false }: HeatmapProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const text = useCellText(asShare)
  const [hovered, setHovered] = useState<StatsHeatmapCell>()

  const byKey = new Map(cells.map((cell) => [`${cell.dayOfWeek}-${cell.hour}`, cell]))
  const max = Math.max(0, ...cells.map((cell) => cell.avgSpotsInUse))
  const level = (value: number) =>
    value <= 0 || max === 0 ? 0 : Math.max(1, Math.ceil((value / max) * (LEVELS.length - 1)))

  return (
    <div className="grid gap-3">
      {/* The hover readout: one line above the grid instead of a floating tooltip per cell */}
      <p className="min-h-5 text-sm tabular-nums" aria-live="polite">
        {hovered ? (
          <>
            <span className="font-semibold">
              {text.day(hovered)} {text.hour(hovered)}
            </span>{' '}
            <span className="text-muted-foreground">· {text.value(hovered)}</span>
          </>
        ) : (
          <span className="text-muted-foreground">{t('stats.heatmap.hint')}</span>
        )}
      </p>

      <div
        className="grid grid-cols-[2.25rem_repeat(24,minmax(0,1fr))] gap-0.5"
        onMouseLeave={() => setHovered(undefined)}
        aria-hidden
      >
        {DAYS.map((dayOfWeek) => (
          <div key={dayOfWeek} className="contents">
            <span className="self-center pr-1 text-xs text-muted-foreground">
              {weekdayName(dayOfWeek, language, 'short')}
            </span>
            {HOURS.map((hour) => {
              const cell = byKey.get(`${dayOfWeek}-${hour}`) ?? {
                dayOfWeek,
                hour,
                avgSpotsInUse: 0,
              }
              return (
                <div
                  key={hour}
                  onMouseEnter={() => setHovered(cell)}
                  className={cn(
                    'aspect-square max-h-8 min-h-3 rounded-[3px] transition-shadow hover:ring-2 hover:ring-foreground/60',
                    LEVELS[level(cell.avgSpotsInUse)],
                  )}
                />
              )
            })}
          </div>
        ))}
        <span />
        {HOURS.map((hour) => (
          <span key={hour} className="text-[10px] text-muted-foreground tabular-nums">
            {LABELED_HOURS.has(hour) ? displayTime(hour * 60) : ''}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{t('stats.heatmap.less')}</span>
        {LEVELS.map((className) => (
          <span key={className} className={cn('size-3 rounded-[3px]', className)} />
        ))}
        <span>{t('stats.heatmap.more')}</span>
        {max > 0 && (
          <span className="ml-auto tabular-nums">
            {t('stats.heatmap.max', {
              value: text.value({ dayOfWeek: 0, hour: 0, avgSpotsInUse: max }),
            })}
          </span>
        )}
      </div>
    </div>
  )
}

/** Table view: the busy cells only, busiest first */
export function BusyHoursTable({ cells, asShare = false }: HeatmapProps) {
  const { t } = useTranslation()
  const text = useCellText(asShare)
  const busy = cells
    .filter((cell) => cell.avgSpotsInUse > 0)
    .sort((a, b) => b.avgSpotsInUse - a.avgSpotsInUse)
  return (
    <StatsTable
      head={[t('stats.table.day'), t('stats.table.hour'), t('stats.table.busy')]}
      rows={busy.map((cell) => ({
        key: `${cell.dayOfWeek}-${cell.hour}`,
        cells: [text.day(cell), text.hour(cell), text.value(cell)],
      }))}
    />
  )
}
