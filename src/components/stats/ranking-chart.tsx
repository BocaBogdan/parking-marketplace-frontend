import { useTranslation } from 'react-i18next'
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { ChartTip, StatsTable } from '@/components/stats/chart-card'
import { formatHours } from '@/lib/format'

export interface RankingItem {
  key: string
  /** On the axis: "Spot 12", a plate */
  label: string
  /** In the tooltip and table only, so axis labels stay short: owner, driver, car */
  detail?: string
  bookings: number
  minutes: number
}

const ROW_PX = 30
const config = { hours: { color: 'var(--chart-1)' } } satisfies ChartConfig

/** Horizontal bars, longest first, with the hours at each bar's end */
export function RankingChart({ items }: { items: RankingItem[] }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const data = items.map((item) => ({ ...item, hours: item.minutes / 60 }))

  return (
    <ChartContainer
      config={config}
      className="aspect-auto w-full"
      style={{ height: data.length * ROW_PX + 8 }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 56, bottom: 0, left: 0 }}
        barCategoryGap={4}
        accessibilityLayer
      >
        <XAxis type="number" dataKey="hours" hide />
        <YAxis
          type="category"
          dataKey="label"
          width={92}
          interval={0}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)' }}
          content={({ active, payload }) => {
            const item = active ? (payload?.[0]?.payload as RankingItem | undefined) : undefined
            if (!item) return null
            return (
              <ChartTip
                title={item.detail ? `${item.label} · ${item.detail}` : item.label}
                lines={[
                  formatHours(item.minutes, language),
                  t('stats.bookingsCount', { count: item.bookings }),
                ]}
              />
            )
          }}
        />
        <Bar
          dataKey="hours"
          fill="var(--color-hours)"
          radius={[0, 4, 4, 0]}
          maxBarSize={18}
          isAnimationActive={false}
        >
          <LabelList
            dataKey="minutes"
            position="right"
            className="fill-foreground"
            fontSize={12}
            formatter={(minutes) => formatHours(Number(minutes), language)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** The ranking's table view */
export function RankingTable({
  items,
  labelHeading,
  detailHeading,
}: {
  items: RankingItem[]
  labelHeading: string
  detailHeading?: string
}) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const head = [
    '#',
    labelHeading,
    ...(detailHeading ? [detailHeading] : []),
    t('stats.table.bookings'),
    t('stats.table.hours'),
  ]
  return (
    <StatsTable
      head={head}
      numericFrom={detailHeading ? 3 : 2}
      rows={items.map((item, index) => ({
        key: item.key,
        cells: [
          index + 1,
          <span className="font-semibold">{item.label}</span>,
          ...(detailHeading ? [item.detail ?? '—'] : []),
          item.bookings,
          formatHours(item.minutes, language),
        ],
      }))}
    />
  )
}
