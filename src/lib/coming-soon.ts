import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

/** For features without a page yet: returns a handler that shows a "coming soon" toast */
export function useComingSoon() {
  const { t } = useTranslation()
  return (feature: string) => toast.info(t('common.comingSoon', { feature }))
}
