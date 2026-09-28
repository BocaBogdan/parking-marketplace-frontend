import type { ReactNode } from 'react'
import { ShieldCheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useComingSoon } from '@/lib/coming-soon'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthLayoutProps {
  title: string
  description: string
  children: ReactNode
}

export function AuthLayout({ title, description, children }: AuthLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="relative flex min-h-svh flex-col bg-linear-to-b from-primary-50 to-background px-4 py-10 dark:from-neutral-900">
      <LanguageSwitcher className="absolute top-4 right-4" />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8">
        <header className="flex flex-col items-center gap-3 text-center">
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-primary text-4xl font-black text-primary-foreground shadow-lg shadow-primary/25">
            P
            <span className="absolute -right-1 -bottom-1 size-5 rounded-full bg-secondary ring-4 ring-primary-50 dark:ring-neutral-900" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('common.appName')}</h1>
            <p className="text-muted-foreground">{t('common.tagline')}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-primary-950 dark:text-neutral-200">
            <ShieldCheckIcon className="size-3.5 text-secondary" />
            {t('common.verificationBadge')}
          </span>
        </header>

        <Card className="gap-6 py-6 shadow-xl shadow-neutral-900/5 [--card-spacing:--spacing(6)]">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </main>

      <footer className="mx-auto mt-8 flex w-full max-w-md items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
          <ShieldCheckIcon className="size-4 text-secondary" />
          {t('common.secureBayLocks')}
        </span>
        <nav className="flex items-center gap-3 font-medium text-muted-foreground">
          <ComingSoonLink label={t('common.help')} />
          <span aria-hidden>•</span>
          <ComingSoonLink label={t('common.terms')} />
        </nav>
      </footer>
    </div>
  )
}

/** Placeholder for pages that don't exist yet — shows a toast instead of navigating */
export function ComingSoonLink({ label, className }: { label: string; className?: string }) {
  const comingSoon = useComingSoon()

  return (
    <button
      type="button"
      onClick={() => comingSoon(label)}
      className={className ?? 'hover:text-foreground'}
    >
      {label}
    </button>
  )
}
