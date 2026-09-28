import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { languages } from '@/i18n'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={cn('inline-flex rounded-full bg-muted p-0.5 text-xs font-semibold', className)}
    >
      {languages.map((language) => {
        const isActive = i18n.resolvedLanguage === language.code
        return (
          <button
            key={language.code}
            type="button"
            lang={language.code}
            title={language.label}
            aria-pressed={isActive}
            onClick={() => void i18n.changeLanguage(language.code)}
            className={cn(
              'rounded-full px-2.5 py-1 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
              isActive && 'bg-background text-foreground shadow-sm',
            )}
          >
            {language.short}
          </button>
        )
      })}
    </div>
  )
}
