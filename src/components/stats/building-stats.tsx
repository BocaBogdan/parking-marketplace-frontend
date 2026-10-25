import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { InfoIcon, Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BusyHoursHeatmap, BusyHoursTable } from '@/components/stats/busy-hours-heatmap'
import { ChartCard } from '@/components/stats/chart-card'
import { KpiRow } from '@/components/stats/kpi-row'
import { RangePicker } from '@/components/stats/range-picker'
import { RankingChart, RankingTable, type RankingItem } from '@/components/stats/ranking-chart'
import { TimelineChart, TimelineTable } from '@/components/stats/timeline-chart'
import { UtilizationChart, UtilizationTable } from '@/components/stats/utilization-chart'
import { formatDuration } from '@/lib/format'
import { bucketUnit, type BucketUnit } from '@/lib/stats'
import { buildingStatsQuery } from '@/queries/admin-stats'
import type { BuildingStats, StatsRange } from '@/types/models'

interface BuildingStatsProps {
  buildingId: string
  range: StatsRange
  onRangeChange: (range: StatsRange) => void
}

/**
 * The building page's Statistics tab. Loaded lazily (default export), so the chart
 * library only downloads when the tab is opened.
 */
export default function BuildingStats({ buildingId, range, onRangeChange }: BuildingStatsProps) {
  const { t } = useTranslation()
  // Keep the previous range's charts on screen while the next one loads
  const { data: stats, isFetching } = useQuery({
    ...buildingStatsQuery(buildingId, range),
    placeholderData: keepPreviousData,
  })

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {t('stats.description')}
          {isFetching && <Loader2Icon className="size-4 animate-spin" />}
        </p>
        <RangePicker value={range} onChange={onRangeChange} />
      </div>
      {stats ? <BuildingStatsBody stats={stats} unit={bucketUnit(range)} /> : <StatsLoading />}
    </>
  )
}

function StatsLoading() {
  return (
    <div className="flex justify-center py-16">
      <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

function BuildingStatsBody({ stats, unit }: { stats: BuildingStats; unit: BucketUnit }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const { kpis } = stats
  const noBookings = kpis.bookings === 0

  const spotItems: RankingItem[] = stats.topSpots.map((spot) => ({
    key: spot.spotId,
    label: t('spots.name', { number: spot.number }),
    detail: spot.ownerName ?? t('buildings.spots.unknownOwner'),
    bookings: spot.bookings,
    minutes: spot.minutes,
  }))
  const carItems: RankingItem[] = stats.topCars.map((car) => ({
    key: car.carId,
    label: car.plate ?? t('stats.topCars.removed'),
    detail: [car.driverName, car.description].filter(Boolean).join(' · ') || undefined,
    bookings: car.bookings,
    minutes: car.minutes,
  }))

  return (
    <>
      <KpiRow
        tiles={[
          { label: t('stats.kpis.bookings'), value: String(kpis.bookings) },
          {
            label: t('stats.kpis.booked'),
            value: kpis.bookedMinutes ? formatDuration(kpis.bookedMinutes * 60_000, language) : '—',
          },
          { label: t('stats.kpis.activeSpots'), value: String(kpis.activeSpots) },
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

      <div className="grid gap-5 md:grid-cols-2">
        <ChartCard
          title={t('stats.topSpots.title')}
          description={t('stats.topSpots.description')}
          isEmpty={noBookings}
          table={
            <RankingTable
              items={spotItems}
              labelHeading={t('stats.table.spot')}
              detailHeading={t('stats.table.owner')}
            />
          }
        >
          <RankingChart items={spotItems} />
        </ChartCard>
        <ChartCard
          title={t('stats.topCars.title')}
          description={t('stats.topCars.description')}
          isEmpty={noBookings}
          table={
            <RankingTable
              items={carItems}
              labelHeading={t('stats.table.car')}
              detailHeading={t('stats.table.driver')}
            />
          }
        >
          <RankingChart items={carItems} />
        </ChartCard>
      </div>

      <ChartCard
        title={t('stats.heatmap.title')}
        description={t('stats.heatmap.description')}
        isEmpty={noBookings}
        table={<BusyHoursTable cells={stats.heatmap} />}
      >
        <BusyHoursHeatmap cells={stats.heatmap} />
      </ChartCard>

      <ChartCard
        title={t('stats.utilization.title')}
        description={t('stats.utilization.description')}
        isEmpty={stats.utilization.length === 0}
        table={<UtilizationTable rows={stats.utilization} />}
      >
        <UtilizationChart rows={stats.utilization} />
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-px size-3.5 shrink-0" />
          {t('stats.utilization.note')}
        </p>
      </ChartCard>
    </>
  )
}
