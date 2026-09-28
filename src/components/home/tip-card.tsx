import { LightbulbIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function TipCard() {
  const { t } = useTranslation()

  return (
    <aside className="flex items-start gap-3 rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary dark:bg-primary-950">
        <LightbulbIcon className="size-4" />
      </div>
      <p className="self-center">{t('home.tip')}</p>
    </aside>
  )
}
