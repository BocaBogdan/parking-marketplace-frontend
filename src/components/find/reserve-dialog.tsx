import { useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CircleAlertIcon, ClockIcon, Loader2Icon, PlusIcon, StarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LicensePlate } from '@/components/cars/license-plate'
import type { BookingWindow } from '@/lib/booking-window'
import { serverErrorMessage } from '@/lib/form'
import { formatDuration, formatTime, toZonedIso, zonedDayKey } from '@/lib/format'
import { cn } from '@/lib/utils'
import { myCarsQuery } from '@/queries/cars'
import { createReservation } from '@/queries/reservations'
import type { components } from '@/types/api'

type Spot = components['schemas']['SpotRead']

interface ReserveDialogProps {
  spot: Spot | undefined
  window: BookingWindow
  onOpenChange: (open: boolean) => void
}

export function ReserveDialog({ spot, window, onOpenChange }: ReserveDialogProps) {
  return (
    <Dialog open={spot !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {spot && (
          <ReserveForm
            key={spot.id}
            spot={spot}
            window={window}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReserveForm({
  spot,
  window,
  onDone,
}: {
  spot: Spot
  window: BookingWindow
  onDone: () => void
}) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const queryClient = useQueryClient()
  const { data: cars } = useSuspenseQuery(myCarsQuery)
  // The backend lists the default car first
  const [carId, setCarId] = useState(() => cars.find((car) => car.is_default)?.id ?? cars[0]?.id)

  const reserve = useMutation({
    mutationFn: () =>
      createReservation({
        spot_id: spot.id,
        car_id: carId!,
        start_at: toZonedIso(window.start),
        end_at: toZonedIso(window.end),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reservations'] }),
        queryClient.invalidateQueries({ queryKey: ['spots', 'available'] }),
      ])
      toast.success(t('find.toast.reserved', { number: spot.spot_number }))
      onDone()
    },
  })

  const day = (ms: number) =>
    zonedDayKey(ms) === window.day ? t('find.today') : t('find.tomorrow')

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">
          {t('find.dialog.title', { number: spot.spot_number })}
        </DialogTitle>
        <DialogDescription>{spot.notes || t('find.dialog.description')}</DialogDescription>
      </DialogHeader>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-primary-50 px-3 py-2.5 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200">
        <ClockIcon className="size-4" />
        <span className="font-semibold tabular-nums">
          {day(window.start)} {formatTime(window.start, language)} – {day(window.end)}{' '}
          {formatTime(window.end, language)}
        </span>
        <span>· {formatDuration(window.end - window.start, language)}</span>
      </p>

      {reserve.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {serverErrorMessage(reserve.error)}
        </p>
      )}

      {cars.length === 0 ? (
        <div className="grid gap-3 rounded-lg border border-dashed p-4 text-center">
          <p className="text-sm text-muted-foreground">{t('find.dialog.noCars')}</p>
          <Button asChild variant="outline">
            <Link to="/cars" search={{ car: 'new' }}>
              <PlusIcon />
              {t('cars.add')}
            </Link>
          </Button>
        </div>
      ) : (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-semibold">{t('find.dialog.chooseCar')}</legend>
          {cars.map((car) => (
            <label
              key={car.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                car.id === carId
                  ? 'border-primary bg-primary-50 dark:bg-primary-950/50'
                  : 'hover:bg-muted',
              )}
            >
              <input
                type="radio"
                name="car"
                value={car.id}
                checked={car.id === carId}
                onChange={() => setCarId(car.id)}
                className="size-4 accent-primary"
              />
              <span className="grid min-w-0 flex-1 justify-items-start gap-1">
                <LicensePlate plate={car.plate} size="sm" />
                {car.nickname && (
                  <span className="truncate text-sm text-muted-foreground">{car.nickname}</span>
                )}
              </span>
              {car.is_default && (
                <Badge className="gap-1">
                  <StarIcon className="fill-current" />
                  {t('cars.default')}
                </Badge>
              )}
            </label>
          ))}
        </fieldset>
      )}

      <Button
        size="lg"
        className="h-12 w-full text-base"
        disabled={!carId || reserve.isPending}
        onClick={() => reserve.mutate()}
      >
        {reserve.isPending && <Loader2Icon className="animate-spin" />}
        {t('find.dialog.confirm', {
          duration: formatDuration(window.end - window.start, language),
        })}
      </Button>
    </>
  )
}
