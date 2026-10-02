import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { CalendarXIcon, SearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { BookingRow } from '@/components/bookings/booking-row'
import { formatDay, groupByDay, parseApiDate } from '@/lib/format'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'
import { myCarsQuery } from '@/queries/cars'
import { myReservationsQuery } from '@/queries/reservations'
import type { components } from '@/types/api'

type Reservation = components['schemas']['ReservationRead']

const tabs = ['upcoming', 'past', 'cancelled'] as const
type Tab = (typeof tabs)[number]

const searchSchema = z.object({
  tab: z.enum(tabs).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/bookings')({
  validateSearch: searchSchema,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.query({ ...myReservationsQuery, staleTime: 'static' }),
      queryClient.query({ ...myCarsQuery, staleTime: 'static' }),
    ]),
  component: BookingsPage,
})

/** Upcoming soonest first (including the one in progress); past and cancelled latest first */
function splitByTab(reservations: Reservation[], now: number): Record<Tab, Reservation[]> {
  const byStartAsc = [...reservations].sort(
    (a, b) => parseApiDate(a.start_at) - parseApiDate(b.start_at),
  )
  const confirmed = byStartAsc.filter((r) => r.status === 'CONFIRMED')
  return {
    upcoming: confirmed.filter((r) => parseApiDate(r.end_at) > now),
    past: confirmed.filter((r) => parseApiDate(r.end_at) <= now).reverse(),
    cancelled: byStartAsc.filter((r) => r.status !== 'CONFIRMED').reverse(),
  }
}

function BookingsPage() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const { tab = 'upcoming' } = Route.useSearch()
  const now = useNow()
  const { data: reservations } = useSuspenseQuery(myReservationsQuery)
  // Includes only cars that still exist; bookings made with a removed car show a placeholder
  const { data: cars } = useSuspenseQuery(myCarsQuery)

  const byTab = splitByTab(reservations, now)
  const shown = byTab[tab]
  const days = groupByDay(shown, (r) => parseApiDate(r.start_at))

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('bookings.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('bookings.description')}</p>
        </div>
        <Button asChild size="lg" className="h-11 rounded-full px-4">
          <Link to="/find">
            <SearchIcon />
            {t('home.findSpot.action')}
          </Link>
        </Button>
      </header>

      <nav
        aria-label={t('bookings.title')}
        className="grid grid-cols-3 rounded-full bg-muted p-1 text-sm font-semibold"
      >
        {tabs.map((key) => (
          <Link
            key={key}
            from={Route.fullPath}
            search={{ tab: key }}
            replace
            resetScroll={false}
            aria-current={tab === key ? 'page' : undefined}
            className={cn(
              'rounded-full px-2 py-2 text-center text-muted-foreground transition-colors hover:text-foreground',
              tab === key && 'bg-background text-foreground shadow-sm',
            )}
          >
            {t(`bookings.tabs.${key}`)} · {byTab[key].length}
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
          <CalendarXIcon className="mb-1 size-6 text-muted-foreground" />
          <p className="font-semibold">{t(`bookings.empty.${tab}`)}</p>
          {tab === 'upcoming' && (
            <Button asChild variant="outline" className="mt-2">
              <Link to="/find">
                <SearchIcon />
                {t('home.findSpot.action')}
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5">
          {days.map(({ day, items }) => (
            <section key={day} className="grid gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {formatDay(items[0].start_at, language, now)}
              </h2>
              <ul className="grid gap-2">
                {items.map((reservation) => (
                  <BookingRow
                    key={reservation.id}
                    reservation={reservation}
                    car={cars.find((car) => car.id === reservation.car_id)}
                    now={now}
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
