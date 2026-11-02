import { ArrowDownToLineIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

export function UndergroundBadge() {
  const { t } = useTranslation()

  return (
    <Badge variant="outline" className="font-bold tracking-wide text-muted-foreground uppercase">
      <ArrowDownToLineIcon data-icon="inline-start" />
      {t('spots.underground')}
    </Badge>
  )
}
