import { CalendarCheckIcon, CarIcon, SquareParkingIcon, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface StatTilesProps {
  spots: number
  cars: number
  active: number
}

export function StatTiles({ spots, cars, active }: StatTilesProps) {
  const { t } = useTranslation()

  return (
    <section className="grid grid-cols-3 gap-3">
      <StatTile
        icon={SquareParkingIcon}
        label={t('home.stats.mySpots')}
        value={spots}
        tone="bg-secondary-100 text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300"
      />
      <StatTile
        icon={CarIcon}
        label={t('home.stats.myCars')}
        value={cars}
        tone="bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
      />
      <StatTile
        icon={CalendarCheckIcon}
        label={t('home.stats.active')}
        value={active}
        tone="bg-tertiary-100 text-tertiary-700 dark:bg-tertiary-950 dark:text-tertiary-300"
        indicator={active > 0}
      />
    </section>
  )
}

interface StatTileProps {
  icon: LucideIcon
  label: string
  value: number
  tone: string
  /** Green dot on the icon, e.g. when something is in progress */
  indicator?: boolean
}

function StatTile({ icon: Icon, label, value, tone, indicator }: StatTileProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card px-2 py-4 text-center shadow-xs">
      <div className={cn('relative flex size-10 items-center justify-center rounded-full', tone)}>
        <Icon className="size-5" />
        {indicator && (
          <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-secondary ring-2 ring-card" />
        )}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-2xl leading-none font-bold">{value}</span>
    </div>
  )
}
