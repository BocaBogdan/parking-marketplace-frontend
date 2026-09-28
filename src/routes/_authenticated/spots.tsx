import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { HeartHandshakeIcon, PlusIcon, SquareParkingIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { AvailabilityDialog } from '@/components/spots/availability-dialog'
import { SpotCard } from '@/components/spots/spot-card'
import { SpotFormDialog } from '@/components/spots/spot-form-dialog'
import { mySpotsQuery } from '@/queries/spots'

// `?spot=new` opens the register dialog, `?spot=<id>` the edit dialog and
// `?availability=<id>` the availability dialog — so other pages
// (e.g. Home's "Register Spot") can link straight to it
const searchSchema = z.object({
  spot: z
    .union([z.literal('new'), z.uuid()])
    .optional()
    .catch(undefined),
  availability: z.uuid().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/spots')({
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(mySpotsQuery),
  component: MySpotsPage,
})

function MySpotsPage() {
  const { t } = useTranslation()
  const { spot: dialog, availability } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: spots } = useSuspenseQuery(mySpotsQuery)

  const editing = spots.find((spot) => spot.id === dialog)
  const managing = spots.find((spot) => spot.id === availability && spot.status === 'APPROVED')
  const openDialog = (spot: 'new' | string) =>
    void navigate({ search: { spot }, replace: true, resetScroll: false })
  const openAvailability = (spotId: string) =>
    void navigate({ search: { availability: spotId }, replace: true, resetScroll: false })
  const closeDialog = () => void navigate({ search: {}, replace: true, resetScroll: false })

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-3xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('spots.title')}</h1>
          {spots.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('spots.count', { count: spots.length })}
            </p>
          )}
        </div>
        <Button size="lg" className="h-11 rounded-full px-4" onClick={() => openDialog('new')}>
          <PlusIcon />
          {t('spots.register')}
        </Button>
      </header>

      {spots.length === 0 ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary dark:bg-primary-950">
            <SquareParkingIcon className="size-6" />
          </div>
          <h2 className="font-semibold">{t('spots.empty.title')}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">{t('spots.empty.description')}</p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {spots.map((spot) => (
              <SpotCard
                key={spot.id}
                spot={spot}
                onEdit={() => openDialog(spot.id)}
                onManageAvailability={() => openAvailability(spot.id)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => openDialog('new')}
            className="flex items-center gap-4 rounded-2xl border border-secondary-200 bg-secondary-50 p-5 text-left transition-colors outline-none hover:bg-secondary-100 focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-secondary-900 dark:bg-secondary-950/40"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-300">
              <HeartHandshakeIcon className="size-6" />
            </span>
            <span className="grid gap-0.5">
              <span className="font-bold">{t('spots.share.title')}</span>
              <span className="text-sm text-muted-foreground">{t('spots.share.description')}</span>
            </span>
          </button>
        </>
      )}

      <AvailabilityDialog spot={managing} onOpenChange={(open) => !open && closeDialog()} />

      <SpotFormDialog
        open={dialog === 'new' || editing !== undefined}
        onOpenChange={(open) => !open && closeDialog()}
        spot={editing}
      />
    </div>
  )
}
