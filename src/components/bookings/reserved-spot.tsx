import { useTranslation } from 'react-i18next'
import { UndergroundBadge } from '@/components/spots/underground-badge'
import { useBuildingNames } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { SpotSummary } from '@/types/models'

interface ReservedSpotProps {
  /** Null if the owner has since deleted the spot */
  spot: SpotSummary | null
  /** Leaves out the description, for small cards */
  compact?: boolean
  className?: string
}

/**
 * Which spot a booking is for: its number, the building (when the driver is in several,
 * or it's a partner building's spot), whether it's underground and the owner's notes.
 */
export function ReservedSpot({ spot, compact = false, className }: ReservedSpotProps) {
  const { t } = useTranslation()
  const buildings = useBuildingNames()

  if (!spot) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>{t('bookings.spotRemoved')}</p>
    )
  }

  const building = spot.building
  const showBuilding = building && (buildings.show || !buildings.nameOf(building.id))

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-base font-bold text-primary dark:bg-primary-950">
        {spot.number}
      </span>
      <div className="grid min-w-0 gap-0.5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
          <span>{t('spots.name', { number: spot.number })}</span>
          {showBuilding && (
            <span className="text-sm font-normal text-muted-foreground">· {building.name}</span>
          )}
          {spot.underground && <UndergroundBadge />}
        </p>
        {!compact && spot.description && (
          <p className="truncate text-sm text-muted-foreground">{spot.description}</p>
        )}
      </div>
    </div>
  )
}
