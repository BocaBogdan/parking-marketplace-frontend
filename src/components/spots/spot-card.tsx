import { Suspense } from 'react'
import { ChevronRightIcon, Loader2Icon, PencilIcon, PlusIcon } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ScheduleTable } from '@/components/spots/schedule-table'
import { WithdrawSpotButton } from '@/components/spots/withdraw-spot-button'
import type { Spot } from '@/types/models'

interface SpotCardProps {
  spot: Spot
  onEdit: () => void
  onManageAvailability: () => void
}

// First release: spots go live as soon as they're registered (no admin review), and the
// "Free now" / "Busy" overrides (components/spots/override-controls.tsx) wait for their API
export function SpotCard({ spot, onEdit, onManageAvailability }: SpotCardProps) {
  const { t } = useTranslation()

  return (
    <article className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs">
      <header className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold">{t('spots.name', { number: spot.number })}</h2>
        <Button
          variant="ghost"
          size="icon-lg"
          className="-mt-1.5 -mr-1.5 text-muted-foreground"
          aria-label={t('spots.form.editTitle', { number: spot.number })}
          onClick={onEdit}
        >
          <PencilIcon />
        </Button>
      </header>

      {spot.description && (
        <p className="text-sm whitespace-pre-line text-muted-foreground">{spot.description}</p>
      )}

      <section className="grid gap-2">
        <h3 className="text-sm font-semibold">{t('availability.weekly')}</h3>
        {/* Prefetched by the route; a spot registered while the page is open loads here */}
        <Suspense
          fallback={
            <div className="flex justify-center py-4">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <ScheduleTable spot={spot} />
        </Suspense>
      </section>
      <Button
        variant="ghost"
        className="h-11 w-full bg-primary-50 text-primary hover:bg-primary-100 hover:text-primary dark:bg-primary-950"
        onClick={onManageAvailability}
      >
        <PlusIcon />
        {t('availability.add')}
      </Button>

      <footer className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/spots/$spotId/reservations"
          params={{ spotId: spot.id }}
          className="flex w-fit items-center text-sm font-semibold text-primary hover:underline"
        >
          {t('spots.viewReservations')}
          <ChevronRightIcon className="size-4" />
        </Link>
        <WithdrawSpotButton spot={spot} />
      </footer>
    </article>
  )
}
