import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { SpotStatus } from '@/types/models'

const tone: Record<SpotStatus, string> = {
  CONFIRMED: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-950 dark:text-secondary-300',
  PENDING: 'bg-tertiary-100 text-tertiary-800 dark:bg-tertiary-950 dark:text-tertiary-300',
  REJECTED: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
}

export function SpotStatusBadge({ status }: { status: SpotStatus }) {
  const { t } = useTranslation()

  return (
    <Badge className={cn('font-bold tracking-wide uppercase', tone[status])}>
      {t(`spots.status.${status}`)}
    </Badge>
  )
}
