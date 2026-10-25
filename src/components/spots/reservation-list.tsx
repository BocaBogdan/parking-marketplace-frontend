import { PhoneIcon, UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/cars/license-plate'
import {
  formatDate,
  formatDay,
  formatDuration,
  formatTime,
  groupByDay,
  zonedDayKey,
} from '@/lib/format'
import { displayName } from '@/lib/users'
import { cn } from '@/lib/utils'
import type { OwnerReservation } from '@/queries/reservations'
import type { AppUser } from '@/types/models'

/** The building admin also sees who booked; the owner sees only the car */
type ListedReservation = OwnerReservation & { driver?: AppUser }

/** A spot's bookings grouped under a heading per start day */
export function ReservationList({
  reservations,
  now,
}: {
  reservations: ListedReservation[]
  now: number
}) {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const days = groupByDay(reservations, (r) => r.start)

  return (
    <div className="grid gap-5">
      {days.map(({ day, items }) => (
        <section key={day} className="grid gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {formatDay(items[0].start, language, now)}
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

function ReservationRow({ reservation, now }: { reservation: ListedReservation; now: number }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const { start, end, car, driver } = reservation
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
        {'driver' in reservation && (
          <p className="flex min-w-0 items-center gap-1.5 text-sm">
            <UserIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {driver ? displayName(driver) || driver.email : t('spotReservations.unknownDriver')}
            </span>
          </p>
        )}
        {car ? (
          <div className="flex flex-wrap items-center gap-2">
            <LicensePlate plate={car.plate} size="sm" />
            <span className="truncate text-sm">{car.description}</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t('spotReservations.unknownCar')}</span>
        )}
      </div>
      {car && (
        <Button asChild variant="outline" className="h-9 px-3">
          <a href={`tel:${car.phone}`} aria-label={t('spotReservations.call', { name: car.plate })}>
            <PhoneIcon />
            <span className="tabular-nums">{car.phone}</span>
          </a>
        </Button>
      )}
    </li>
  )
}
