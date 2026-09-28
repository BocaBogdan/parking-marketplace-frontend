import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PencilIcon, StarIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LicensePlate } from '@/components/cars/license-plate'
import { RemoveCarButton } from '@/components/cars/remove-car-button'
import { serverErrorMessage } from '@/lib/form'
import { myCarsQuery, updateCar } from '@/queries/cars'
import type { components } from '@/types/api'

type Car = components['schemas']['CarRead']

interface CarCardProps {
  car: Car
  hasOtherCars: boolean
  onEdit: () => void
}

export function DefaultCarCard({ car, hasOtherCars, onEdit }: CarCardProps) {
  const { t } = useTranslation()

  return (
    <article className="grid gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-900 dark:bg-primary-950/40">
      <header className="flex items-start justify-between gap-3">
        <Badge className="gap-1 font-bold tracking-wide uppercase">
          <StarIcon className="fill-current" />
          {t('cars.default')}
        </Badge>
        <div className="-mt-1.5 -mr-1.5 flex">
          <Button
            variant="ghost"
            size="icon-lg"
            className="text-muted-foreground"
            aria-label={t('cars.edit', { plate: car.plate })}
            onClick={onEdit}
          >
            <PencilIcon />
          </Button>
          <RemoveCarButton car={car} hasOtherCars={hasOtherCars} />
        </div>
      </header>
      <div className="grid justify-items-start gap-2">
        <LicensePlate plate={car.plate} size="lg" />
        {car.nickname && <p className="text-lg font-semibold">{car.nickname}</p>}
        <p className="text-sm text-muted-foreground">{t('cars.defaultDescription')}</p>
      </div>
    </article>
  )
}

export function CarCard({ car, hasOtherCars, onEdit }: CarCardProps) {
  const { t } = useTranslation()
  const setDefault = useSetDefaultCar()

  return (
    <article className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs">
      <div className="grid min-w-0 flex-1 justify-items-start gap-1.5">
        <LicensePlate plate={car.plate} />
        {car.nickname && <p className="truncate text-sm font-medium">{car.nickname}</p>}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          className="h-9 bg-primary-50 px-3 text-primary hover:bg-primary-100 hover:text-primary dark:bg-primary-950"
          disabled={setDefault.isPending}
          onClick={() => setDefault.mutate(car)}
        >
          <StarIcon />
          {t('cars.setDefault')}
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground"
          aria-label={t('cars.edit', { plate: car.plate })}
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
        <RemoveCarButton car={car} hasOtherCars={hasOtherCars} />
      </div>
    </article>
  )
}

/** Makes a car the default, updating the list immediately and rolling back if the request fails */
function useSetDefaultCar() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { queryKey } = myCarsQuery

  return useMutation({
    mutationFn: (car: Car) => updateCar(car.id, { is_default: true }),
    onMutate: async (car) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)
      // Same order as the backend: default first, then oldest first
      queryClient.setQueryData(queryKey, (cars) =>
        cars
          ?.map((c) => ({ ...c, is_default: c.id === car.id }))
          .sort(
            (a, b) =>
              Number(b.is_default) - Number(a.is_default) ||
              a.created_at.localeCompare(b.created_at),
          ),
      )
      return { previous }
    },
    onSuccess: (_, car) => toast.success(t('cars.toast.defaultSet', { plate: car.plate })),
    onError: (error, _, context) => {
      queryClient.setQueryData(queryKey, context?.previous)
      toast.error(serverErrorMessage(error))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}
