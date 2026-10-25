import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { ChartTip, StatsTable } from '@/components/stats/chart-card'
import { formatDayKey, formatHours } from '@/lib/format'
import type { BucketUnit } from '@/lib/stats'
import type { StatsBucket } from '@/types/models'

const config = { hours: { color: 'var(--chart-1)' } } satisfies ChartConfig

function useBucketLabels(unit: BucketUnit) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const short = (day: string) =>
    formatDayKey(
      day,
      language,
      unit === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' },
    )
  const long = (day: string) =>
    unit === 'month'
      ? formatDayKey(day, language, { month: 'long', year: 'numeric' })
      : unit === 'week'
        ? t('stats.timeline.weekOf', {
            date: formatDayKey(day, language, { month: 'short', day: 'numeric' }),
          })
        : formatDayKey(day, language, { weekday: 'short', month: 'short', day: 'numeric' })
  return { short, long, language }
}

/** Booked hours per bucket, as columns; the booking count is in the tooltip */
export function TimelineChart({ buckets, unit }: { buckets: StatsBucket[]; unit: BucketUnit }) {
  const { t } = useTranslation()
  const { short, long, language } = useBucketLabels(unit)
  const data = buckets.map((bucket) => ({ ...bucket, hours: bucket.minutes / 60 }))

  return (
    <ChartContainer config={config} className="aspect-auto h-56 w-full">
      <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="bucketStart"
          tickLine={false}
          axisLine={false}
          minTickGap={16}
          tickFormatter={short}
        />
        <YAxis
          width={44}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          tickFormatter={(hours: number) => formatHours(hours * 60, language)}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)' }}
          content={({ active, payload }) => {
            const bucket = active ? (payload?.[0]?.payload as StatsBucket | undefined) : undefined
            if (!bucket) return null
            return (
              <ChartTip
                title={long(bucket.bucketStart)}
                lines={[
                  formatHours(bucket.minutes, language),
                  t('stats.bookingsCount', { count: bucket.bookings }),
                ]}
              />
            )
          }}
        />
        <Bar
          dataKey="hours"
          fill="var(--color-hours)"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  )
}

export function TimelineTable({ buckets, unit }: { buckets: StatsBucket[]; unit: BucketUnit }) {
  const { t } = useTranslation()
  const { long, language } = useBucketLabels(unit)
  return (
    <StatsTable
      head={[t('stats.table.period'), t('stats.table.bookings'), t('stats.table.hours')]}
      numericFrom={1}
      rows={buckets.map((bucket) => ({
        key: bucket.bucketStart,
        cells: [long(bucket.bucketStart), bucket.bookings, formatHours(bucket.minutes, language)],
      }))}
    />
  )
}
