import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/cars/license-plate'
import { serverErrorMessage } from '@/lib/form'
import { formatDate, formatDuration, formatTime, parseApiDate, zonedDayKey } from '@/lib/format'
import { cn } from '@/lib/utils'
import { cancelReservation } from '@/queries/reservations'
import type { components } from '@/types/api'

type Reservation = components['schemas']['ReservationRead']
type Car = components['schemas']['CarRead']

/** Cancelling closes 15 minutes before the start (backend rule) */
const CANCELLATION_CUTOFF_MS = 15 * 60 * 1000

type Phase = 'inProgress' | 'confirmed' | 'completed' | 'cancelled' | 'cancelledByAdmin'

const phaseBadge: Record<Phase, string> = {
  inProgress: 'bg-secondary text-secondary-foreground',
  confirmed: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-950 dark:text-secondary-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
  cancelledByAdmin: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
}

interface BookingRowProps {
  reservation: Reservation
  /** The car may have been removed since; then only a placeholder is shown */
  car: Car | undefined
  now: number
}

export function BookingRow({ reservation, car, now }: BookingRowProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const start = parseApiDate(reservation.start_at)
  const end = parseApiDate(reservation.end_at)

  const phase: Phase =
    reservation.status === 'CANCELLED'
      ? 'cancelled'
      : reservation.status === 'CANCELLED_BY_ADMIN'
        ? 'cancelledByAdmin'
        : end <= now
          ? 'completed'
          : start <= now
            ? 'inProgress'
            : 'confirmed'
  const canCancel = phase === 'confirmed' && now < start - CANCELLATION_CUTOFF_MS
  // Overnight bookings show the end date too
  const endLabel =
    zonedDayKey(end) === zonedDayKey(start)
      ? formatTime(end, language)
      : `${formatDate(end, language)}, ${formatTime(end, language)}`

  return (
    <li
      className={cn(
        'grid gap-3 rounded-2xl border bg-card p-4 shadow-xs',
        phase === 'inProgress' &&
          'border-secondary-300 bg-secondary-50 dark:border-secondary-800 dark:bg-secondary-950/40',
        (phase === 'cancelled' || phase === 'cancelledByAdmin') && 'opacity-75',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="flex flex-wrap items-baseline gap-x-2 font-semibold tabular-nums">
          <span className={cn(phase.startsWith('cancelled') && 'line-through')}>
            {formatTime(start, language)} – {endLabel}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            · {formatDuration(end - start, language)}
          </span>
        </p>
        <Badge className={cn('font-bold tracking-wide uppercase', phaseBadge[phase])}>
          {t(`bookings.status.${phase}`)}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {car ? (
          <span className="flex min-w-0 items-center gap-2">
            <LicensePlate plate={car.plate} size="sm" />
            {car.nickname && (
              <span className="truncate text-sm text-muted-foreground">{car.nickname}</span>
            )}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">{t('bookings.removedCar')}</span>
        )}

        {canCancel ? (
          <CancelBookingButton reservation={reservation} />
        ) : (
          phase === 'confirmed' && (
            <span className="text-xs text-muted-foreground">{t('bookings.cancelClosed')}</span>
          )
        )}
      </div>
    </li>
  )
}

function CancelBookingButton({ reservation }: { reservation: Reservation }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const queryClient = useQueryClient()

  const cancel = useMutation({
    mutationFn: () => cancelReservation(reservation.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservations'] }),
        // The freed window shows up in Find Spot again
        queryClient.invalidateQueries({ queryKey: ['spots', 'available'] }),
      ])
      toast.success(t('bookings.toast.cancelled'))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={cancel.isPending}
        >
          {cancel.isPending && <Loader2Icon className="animate-spin" />}
          {t('bookings.cancel')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('bookings.cancelConfirm.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('bookings.cancelConfirm.description', {
              date: formatDate(reservation.start_at, language),
              from: formatTime(reservation.start_at, language),
              to: formatTime(reservation.end_at, language),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('bookings.cancelConfirm.keep')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => cancel.mutate()}>
            {t('bookings.cancel')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
