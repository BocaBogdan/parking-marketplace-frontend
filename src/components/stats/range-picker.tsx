import { useTranslation } from 'react-i18next'
import { STATS_RANGES } from '@/lib/stats'
import { cn } from '@/lib/utils'
import type { StatsRange } from '@/types/models'

/** The period every chart on the page covers */
export function RangePicker({
  value,
  onChange,
}: {
  value: StatsRange
  onChange: (range: StatsRange) => void
}) {
  const { t } = useTranslation()
  return (
    <div
      role="group"
      aria-label={t('stats.range.label')}
      className="grid grid-cols-4 rounded-full bg-muted p-1 text-sm font-semibold"
    >
      {STATS_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          aria-pressed={value === range}
          onClick={() => onChange(range)}
          className={cn(
            'rounded-full px-3 py-1.5 whitespace-nowrap text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
            value === range && 'bg-background text-foreground shadow-sm',
          )}
        >
          {t(`stats.range.short.${range}`)}
        </button>
      ))}
    </div>
  )
}
