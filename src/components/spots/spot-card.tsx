import { Suspense } from 'react'
import {
  ChevronRightIcon,
  CircleAlertIcon,
  ClockIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ScheduleTable } from '@/components/spots/schedule-table'
import { SpotStatusBadge } from '@/components/spots/spot-status-badge'
import { WithdrawSpotButton } from '@/components/spots/withdraw-spot-button'
import { formatDate } from '@/lib/format'
import type { Spot } from '@/types/models'

interface SpotCardProps {
  spot: Spot
  onEdit: () => void
  onManageAvailability: () => void
}

// A spot is bookable once an admin approves it; the owner can set its hours before that.
// The "Free now" / "Busy" overrides (components/spots/override-controls.tsx) wait for their API
export function SpotCard({ spot, onEdit, onManageAvailability }: SpotCardProps) {
  const { t, i18n } = useTranslation()

  return (
    <article className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs">
      <header className="flex items-start justify-between gap-3">
        <div className="grid justify-items-start gap-1.5">
          <h2 className="text-xl font-bold">{t('spots.name', { number: spot.number })}</h2>
          <SpotStatusBadge status={spot.status} />
        </div>
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

      {spot.status === 'PENDING' && (
        <p className="flex items-start gap-2 rounded-lg bg-tertiary-50 px-3 py-2.5 text-sm dark:bg-tertiary-950/40">
          <ClockIcon className="mt-0.5 size-4 shrink-0 text-tertiary-700 dark:text-tertiary-300" />
          <span className="grid">
            <span className="font-semibold">{t('spots.waitingApproval')}</span>
            <span className="text-muted-foreground">
              {t('spots.submitted', {
                date: formatDate(spot.updatedAt, i18n.resolvedLanguage ?? 'en'),
              })}
            </span>
          </span>
        </p>
      )}
      {spot.status === 'REJECTED' && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm dark:bg-destructive/20">
          <CircleAlertIcon className="size-4 shrink-0 text-destructive" />
          <span className="grid flex-1">
            <span className="font-semibold text-destructive">{t('spots.rejected')}</span>
            <span className="text-muted-foreground">{t('spots.actionRequired')}</span>
          </span>
          <Button size="sm" variant="outline" onClick={onEdit}>
            {t('spots.editResubmit')}
          </Button>
        </div>
      )}

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
