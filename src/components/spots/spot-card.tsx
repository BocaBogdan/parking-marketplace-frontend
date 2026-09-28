import {
  CalendarCogIcon,
  ChevronRightIcon,
  CircleAlertIcon,
  HourglassIcon,
  PencilIcon,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WithdrawSpotButton } from '@/components/spots/withdraw-spot-button'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { ActiveSpot } from '@/queries/spots'

type Spot = ActiveSpot

const statusBadge: Record<Spot['status'], string> = {
  APPROVED: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-950 dark:text-secondary-300',
  PENDING: 'bg-tertiary-100 text-tertiary-800 dark:bg-tertiary-950 dark:text-tertiary-300',
  REJECTED: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
}

interface SpotCardProps {
  spot: Spot
  onEdit: () => void
  onManageAvailability: () => void
}

export function SpotCard({ spot, onEdit, onManageAvailability }: SpotCardProps) {
  const { t, i18n } = useTranslation()

  return (
    <article className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs">
      <header className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-bold">{t('spots.name', { number: spot.spot_number })}</h2>
        <Badge className={cn('font-bold tracking-wide uppercase', statusBadge[spot.status])}>
          {t(`spots.status.${spot.status}`)}
        </Badge>
      </header>

      {spot.notes && (
        <p className="text-sm whitespace-pre-line text-muted-foreground">{spot.notes}</p>
      )}

      {spot.status === 'APPROVED' && (
        <>
          <Button
            variant="ghost"
            className="h-11 w-full bg-primary-50 text-primary hover:bg-primary-100 hover:text-primary dark:bg-primary-950"
            onClick={onManageAvailability}
          >
            <CalendarCogIcon />
            {t('spots.manageAvailability')}
          </Button>
          <Link
            to="/spots/$spotId/reservations"
            params={{ spotId: spot.id }}
            className="flex w-fit items-center text-sm font-semibold text-primary hover:underline"
          >
            {t('spots.viewReservations')}
            <ChevronRightIcon className="size-4" />
          </Link>
        </>
      )}

      {spot.status === 'PENDING' && (
        <>
          <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm">
            <HourglassIcon className="size-4 shrink-0 text-tertiary" />
            <span>
              <span className="font-semibold">{t('spots.waitingApproval')}</span>{' '}
              <span className="text-muted-foreground">
                ·{' '}
                {t('spots.submitted', {
                  date: formatDate(spot.updated_at, i18n.resolvedLanguage ?? 'en'),
                })}
              </span>
            </span>
          </p>
          <footer className="flex justify-end gap-1">
            <WithdrawSpotButton spot={spot} />
            <Button variant="ghost" size="lg" className="text-primary" onClick={onEdit}>
              <PencilIcon />
              {t('spots.editDetails')}
            </Button>
          </footer>
        </>
      )}

      {spot.status === 'REJECTED' && (
        <>
          <div
            role="note"
            className="grid gap-1 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <p className="flex items-center gap-2 font-semibold">
              <CircleAlertIcon className="size-4" />
              {t('spots.rejectionReason')}
            </p>
            {spot.rejection_reason && <p>{spot.rejection_reason}</p>}
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">{t('spots.actionRequired')}</p>
            <div className="flex gap-1">
              <WithdrawSpotButton spot={spot} />
              <Button
                variant="ghost"
                size="lg"
                className="bg-primary-50 text-primary hover:bg-primary-100 hover:text-primary dark:bg-primary-950"
                onClick={onEdit}
              >
                <PencilIcon />
                {t('spots.editResubmit')}
              </Button>
            </div>
          </footer>
        </>
      )}
    </article>
  )
}
