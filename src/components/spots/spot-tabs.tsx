import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

const tabClassName =
  '-mb-px border-b-2 border-transparent pb-2.5 text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-primary data-[status=active]:text-foreground'

/** Switches between an owner's two pages of one spot */
export function SpotTabs({ spotId, number }: { spotId: string; number: number }) {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('spots.name', { number })}
      className="flex gap-6 border-b text-sm font-semibold"
    >
      <Link to="/spots/$spotId/reservations" params={{ spotId }} className={tabClassName}>
        {t('spotReservations.title')}
      </Link>
      <Link to="/spots/$spotId/stats" params={{ spotId }} className={tabClassName}>
        {t('stats.title')}
      </Link>
    </nav>
  )
}
