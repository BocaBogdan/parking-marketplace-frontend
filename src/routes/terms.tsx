import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language-switcher'
import { TermsEn, TermsRo } from '@/components/terms/terms-content'
import { LAST_UPDATED } from '@/components/terms/terms-meta'
import { isAuthenticated } from '@/lib/auth'

// Public: linked from the sign-in and sign-up pages as well as the account menu
export const Route = createFileRoute('/terms')({
  component: TermsPage,
})

function TermsPage() {
  const { t, i18n } = useTranslation()
  const appName = t('common.appName')
  const language = i18n.resolvedLanguage ?? 'ro'

  return (
    <div className="min-h-svh bg-background px-4 py-8">
      <article className="mx-auto grid max-w-2xl gap-6 text-sm leading-relaxed sm:text-base">
        <div className="flex items-center justify-between gap-3">
          <Link
            to={isAuthenticated() ? '/home' : '/login'}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="size-4" />
            {t('terms.back')}
          </Link>
          <LanguageSwitcher />
        </div>
        <header>
          <h1 className="text-2xl font-bold tracking-tight">{t('terms.title')}</h1>
          <p className="text-muted-foreground">
            {t('terms.lastUpdated', {
              date: new Intl.DateTimeFormat(language, { dateStyle: 'long' }).format(LAST_UPDATED),
            })}
          </p>
        </header>
        {language === 'ro' ? <TermsRo appName={appName} /> : <TermsEn appName={appName} />}
      </article>
    </div>
  )
}
