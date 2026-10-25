import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeftIcon, Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { SpotTabs } from '@/components/spots/spot-tabs'
import { BusyHoursHeatmap, BusyHoursTable } from '@/components/stats/busy-hours-heatmap'
import { ChartCard } from '@/components/stats/chart-card'
import { KpiRow } from '@/components/stats/kpi-row'
import { RangePicker } from '@/components/stats/range-picker'
import { RankingChart, RankingTable, type RankingItem } from '@/components/stats/ranking-chart'
import { TimelineChart, TimelineTable } from '@/components/stats/timeline-chart'
import { bucketUnit, STATS_RANGES, utilizationOf, type BucketUnit } from '@/lib/stats'
import { formatDuration, formatHours } from '@/lib/format'
import { mySpotsQuery, spotStatsQuery } from '@/queries/spots'
import type { SpotStats } from '@/types/models'

const searchSchema = z.object({
  range: z.enum(STATS_RANGES).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/spots/$spotId/stats')({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { range } }) => ({ range: range ?? '30d' }),
  loader: async ({ context: { queryClient }, params: { spotId }, deps: { range } }) => {
    const spots = await queryClient.query({ ...mySpotsQuery, staleTime: 'static' })
    if (!spots.some((spot) => spot.id === spotId)) throw notFound()
    await queryClient.query({ ...spotStatsQuery(spotId, range), staleTime: 'static' })
  },
  component: SpotStatsPage,
})

function SpotStatsPage() {
  const { t } = useTranslation()
  const { spotId } = Route.useParams()
  const { range = '30d' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: spots } = useSuspenseQuery(mySpotsQuery)
  const spot = spots.find((s) => s.id === spotId)
  // Not suspense: keep the previous range's charts on screen while the next one loads
  const { data: stats, isFetching } = useQuery({
    ...spotStatsQuery(spotId, range),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-3xl">
      <header className="grid gap-3">
        <Link
          to="/spots"
          className="flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-4" />
          {t('nav.mySpots')}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              {t('stats.title')}
              {isFetching && <Loader2Icon className="size-4 animate-spin text-muted-foreground" />}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('spots.name', { number: spot?.number })}
            </p>
          </div>
          <RangePicker
            value={range}
            onChange={(next) =>
              void navigate({ search: { range: next }, replace: true, resetScroll: false })
            }
          />
        </div>
      </header>

      {spot && <SpotTabs spotId={spot.id} number={spot.number} />}

      {stats && <SpotStatsBody stats={stats} unit={bucketUnit(range)} />}
    </div>
  )
}

function SpotStatsBody({ stats, unit }: { stats: SpotStats; unit: BucketUnit }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const { kpis, utilization } = stats
  const noBookings = kpis.bookings === 0
  const share = utilizationOf(utilization)

  const carItems: RankingItem[] = stats.topCars.map((car) => ({
    key: car.carId,
    label: car.plate ?? t('stats.topCars.removed'),
    detail: car.description || undefined,
    bookings: car.bookings,
    minutes: car.minutes,
  }))

  return (
    <>
      <KpiRow
        tiles={[
          { label: t('stats.kpis.bookings'), value: String(kpis.bookings) },
          {
            label: t('stats.kpis.shared'),
            value: kpis.bookedMinutes ? formatDuration(kpis.bookedMinutes * 60_000, language) : '—',
          },
          {
            label: t('stats.kpis.utilization'),
            value:
              share === undefined
                ? t('stats.utilization.noHours')
                : new Intl.NumberFormat(language, {
                    style: 'percent',
                    maximumFractionDigits: 0,
                  }).format(share),
            meter: share,
            hint:
              share === undefined
                ? undefined
                : t('stats.utilization.detail', {
                    booked: formatHours(utilization.bookedMinutes, language),
                    offered: formatHours(utilization.offeredMinutes, language),
                  }),
          },
          { label: t('stats.kpis.drivers'), value: String(kpis.drivers) },
          {
            label: t('stats.kpis.avgLength'),
            value: kpis.avgBookingMinutes
              ? formatDuration(kpis.avgBookingMinutes * 60_000, language)
              : '—',
          },
        ]}
      />

      <ChartCard
        title={t('stats.timeline.title')}
        description={t(`stats.timeline.description.${unit}`)}
        isEmpty={noBookings}
        table={<TimelineTable buckets={stats.timeline} unit={unit} />}
      >
        <TimelineChart buckets={stats.timeline} unit={unit} />
      </ChartCard>

      <ChartCard
        title={t('stats.heatmap.title')}
        description={t('stats.heatmap.spotDescription')}
        isEmpty={noBookings}
        table={<BusyHoursTable cells={stats.heatmap} asShare />}
      >
        <BusyHoursHeatmap cells={stats.heatmap} asShare />
      </ChartCard>

      <ChartCard
        title={t('stats.topCars.spotTitle')}
        description={t('stats.topCars.description')}
        isEmpty={noBookings}
        table={
          <RankingTable
            items={carItems}
            labelHeading={t('stats.table.car')}
            detailHeading={t('stats.table.details')}
          />
        }
      >
        <RankingChart items={carItems} />
      </ChartCard>
    </>
  )
}
