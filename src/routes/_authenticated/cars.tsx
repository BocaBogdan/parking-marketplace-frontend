import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { CarIcon, InfoIcon, PlusIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { CarCard, DefaultCarCard } from '@/components/cars/car-cards'
import { CarFormDialog } from '@/components/cars/car-form-dialog'
import { myCarsQuery } from '@/queries/cars'

// `?car=new` opens the add dialog and `?car=<id>` the edit dialog, so they're linkable
const searchSchema = z.object({
  car: z
    .union([z.literal('new'), z.uuid()])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/_authenticated/cars')({
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.query({ ...myCarsQuery, staleTime: 'static' }),
  component: MyCarsPage,
})

function MyCarsPage() {
  const { t } = useTranslation()
  const { car: dialog } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: cars } = useSuspenseQuery(myCarsQuery)

  const defaultCar = cars.find((car) => car.is_default)
  const otherCars = cars.filter((car) => !car.is_default)
  const hasOtherCars = cars.length > 1
  const editing = cars.find((car) => car.id === dialog)

  const openDialog = (car: 'new' | string) =>
    void navigate({ search: { car }, replace: true, resetScroll: false })
  const closeDialog = () => void navigate({ search: {}, replace: true, resetScroll: false })

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('cars.title')}</h1>
          {cars.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('cars.count', { count: cars.length })}
            </p>
          )}
        </div>
        <Button size="lg" className="h-11 rounded-full px-4" onClick={() => openDialog('new')}>
          <PlusIcon />
          {t('cars.add')}
        </Button>
      </header>

      {cars.length === 0 ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary dark:bg-primary-950">
            <CarIcon className="size-6" />
          </div>
          <h2 className="font-semibold">{t('cars.empty.title')}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{t('cars.empty.description')}</p>
        </section>
      ) : (
        <>
          {defaultCar && (
            <DefaultCarCard
              car={defaultCar}
              hasOtherCars={hasOtherCars}
              onEdit={() => openDialog(defaultCar.id)}
            />
          )}

          {otherCars.length > 0 && (
            <section className="grid gap-3">
              <h2 className="text-lg font-bold">{t('cars.otherCars')}</h2>
              {otherCars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  hasOtherCars={hasOtherCars}
                  onEdit={() => openDialog(car.id)}
                />
              ))}
            </section>
          )}

          <aside className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>{t('cars.tip')}</p>
          </aside>
        </>
      )}

      <CarFormDialog
        open={dialog === 'new' || editing !== undefined}
        onOpenChange={(open) => !open && closeDialog()}
        car={editing}
        hasCars={cars.length > 0}
      />
    </div>
  )
}
