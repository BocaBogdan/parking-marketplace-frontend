import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { ArrowLeftIcon, CalendarXIcon, PhoneIcon, ShieldIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/cars/license-plate'
import {
  formatDate,
  formatDay,
  formatDuration,
  formatTime,
  groupByDay,
  parseApiDate,
  zonedDayKey,
} from '@/lib/format'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'
import { mySpotsQuery, spotReservationsQuery } from '@/queries/spots'
import type { components } from '@/types/api'

type Reservation = components['schemas']['OwnerReservationRead']

const searchSchema = z.object({
  tab: z.enum(['upcoming', 'past']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/spots/$spotId/reservations')({
  validateSearch: searchSchema,
  loader: async ({ context: { queryClient }, params: { spotId } }) => {
    const spots = await queryClient.query({ ...mySpotsQuery, staleTime: 'static' })
    if (!spots.some((spot) => spot.id === spotId)) throw notFound()
    await queryClient.query({ ...spotReservationsQuery(spotId), staleTime: 'static' })
  },
  component: SpotReservationsPage,
})

function SpotReservationsPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const { spotId } = Route.useParams()
  const { tab = 'upcoming' } = Route.useSearch()
  const now = useNow()
  const { data: spots } = useSuspenseQuery(mySpotsQuery)
  const { data: reservations } = useSuspenseQuery(spotReservationsQuery(spotId))
  const spot = spots.find((s) => s.id === spotId)

  // Upcoming includes the booking in progress; past is most recent first
  const upcoming = reservations.filter((r) => parseApiDate(r.end_at) > now)
  const past = reservations.filter((r) => parseApiDate(r.end_at) <= now).reverse()
  const shown = tab === 'upcoming' ? upcoming : past
  const hoursShared = past.reduce(
    (sum, r) => sum + parseApiDate(r.end_at) - parseApiDate(r.start_at),
    0,
  )

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-2xl">
      <header className="grid gap-3">
        <Link
          to="/spots"
          className="flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-4" />
          {t('nav.mySpots')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('spotReservations.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('spots.name', { number: spot?.spot_number })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label={t('spotReservations.stats.bookings')} value={String(past.length)} />
        <Stat
          label={t('spotReservations.stats.shared')}
          value={hoursShared > 0 ? formatDuration(hoursShared, language) : '—'}
        />
      </div>

      <nav
        aria-label={t('spotReservations.title')}
        className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold"
      >
        {(['upcoming', 'past'] as const).map((key) => (
          <Link
            key={key}
            from={Route.fullPath}
            search={{ tab: key }}
            replace
            resetScroll={false}
            className={cn(
              'rounded-full px-3 py-2 text-center text-muted-foreground transition-colors hover:text-foreground',
              tab === key && 'bg-background text-foreground shadow-sm',
            )}
          >
            {t(`spotReservations.tabs.${key}`)} ·{' '}
            {key === 'upcoming' ? upcoming.length : past.length}
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
          <CalendarXIcon className="mb-1 size-6 text-muted-foreground" />
          <p className="font-semibold">{t(`spotReservations.empty.${tab}`)}</p>
        </div>
      ) : (
        <ReservationList reservations={shown} now={now} />
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldIcon className="size-3.5 shrink-0" />
        {t('spotReservations.privacy')}
      </p>
    </div>
  )
}

function useLanguage() {
  const { i18n } = useTranslation()
  return i18n.resolvedLanguage ?? 'en'
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

/** Bookings grouped under a heading per start day */
function ReservationList({ reservations, now }: { reservations: Reservation[]; now: number }) {
  const language = useLanguage()
  const days = groupByDay(reservations, (r) => parseApiDate(r.start_at))

  return (
    <div className="grid gap-5">
      {days.map(({ day, items }) => (
        <section key={day} className="grid gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {formatDay(items[0].start_at, language, now)}
          </h2>
          <ul className="grid gap-2">
            {items.map((reservation) => (
              <ReservationRow key={reservation.id} reservation={reservation} now={now} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ReservationRow({ reservation, now }: { reservation: Reservation; now: number }) {
  const { t } = useTranslation()
  const language = useLanguage()
  const start = parseApiDate(reservation.start_at)
  const end = parseApiDate(reservation.end_at)
  const isNow = start <= now && now < end
  // Overnight bookings show the end date too
  const endLabel =
    zonedDayKey(end) === zonedDayKey(start)
      ? formatTime(end, language)
      : `${formatDate(end, language)}, ${formatTime(end, language)}`

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs',
        isNow &&
          'border-secondary-300 bg-secondary-50 dark:border-secondary-800 dark:bg-secondary-950/40',
      )}
    >
      <div className="grid min-w-0 flex-1 gap-1.5">
        <p className="flex flex-wrap items-center gap-2 font-semibold tabular-nums">
          {formatTime(start, language)} – {endLabel}
          <span className="text-sm font-normal text-muted-foreground">
            · {formatDuration(end - start, language)}
          </span>
          {isNow && (
            <Badge className="bg-secondary text-secondary-foreground">
              {t('spotReservations.parkedNow')}
            </Badge>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <LicensePlate plate={reservation.car_plate} size="sm" />
          <span className="truncate text-sm">{reservation.driver_name}</span>
        </div>
      </div>
      <Button asChild variant="outline" className="h-9 px-3">
        <a
          href={`tel:${reservation.driver_phone}`}
          aria-label={t('spotReservations.call', { name: reservation.driver_name })}
        >
          <PhoneIcon />
          <span className="tabular-nums">{reservation.driver_phone}</span>
        </a>
      </Button>
    </li>
  )
}
