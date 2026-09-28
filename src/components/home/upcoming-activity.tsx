import { CalendarXIcon, ChevronRightIcon, ClockIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { LicensePlate } from '@/components/cars/license-plate'
import { useComingSoon } from '@/lib/coming-soon'
import { formatDay, formatTime, parseApiDate } from '@/lib/format'
import type { components } from '@/types/api'

interface UpcomingActivityProps {
  reservation: components['schemas']['ReservationRead'] | undefined
  cars: components['schemas']['CarRead'][]
  now: number
}

export function UpcomingActivity({ reservation, cars, now }: UpcomingActivityProps) {
  const { t } = useTranslation()
  const comingSoon = useComingSoon()

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('home.upcoming.title')}</h2>
        <button
          type="button"
          onClick={() => comingSoon(t('nav.bookings'))}
          className="flex items-center text-sm font-semibold text-primary hover:underline"
        >
          {t('home.upcoming.history')}
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
      {reservation ? (
        <ReservationCard reservation={reservation} cars={cars} now={now} />
      ) : (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed p-6 text-center">
          <CalendarXIcon className="mb-1 size-6 text-muted-foreground" />
          <p className="font-semibold">{t('home.upcoming.empty')}</p>
          <p className="text-sm text-muted-foreground">{t('home.upcoming.emptyHint')}</p>
        </div>
      )}
    </section>
  )
}

function ReservationCard({
  reservation,
  cars,
  now,
}: {
  reservation: components['schemas']['ReservationRead']
  cars: components['schemas']['CarRead'][]
  now: number
}) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const car = cars.find((c) => c.id === reservation.car_id)
  const isInProgress = parseApiDate(reservation.start_at) <= now

  return (
    <article className="grid gap-3 rounded-2xl border bg-card p-4 shadow-xs">
      <Badge
        className={
          isInProgress
            ? 'bg-tertiary-100 font-bold tracking-wide text-tertiary-800 uppercase dark:bg-tertiary-950 dark:text-tertiary-300'
            : 'bg-secondary-100 font-bold tracking-wide text-secondary-800 uppercase dark:bg-secondary-950 dark:text-secondary-300'
        }
      >
        {isInProgress ? t('home.upcoming.inProgress') : t('home.upcoming.confirmed')}
      </Badge>
      <p className="flex items-center gap-2 font-semibold">
        <ClockIcon className="size-4 text-tertiary" />
        {formatDay(reservation.start_at, language, now)} •{' '}
        {formatTime(reservation.start_at, language)} – {formatTime(reservation.end_at, language)}
      </p>
      {car && <LicensePlate plate={car.plate} size="sm" />}
    </article>
  )
}
