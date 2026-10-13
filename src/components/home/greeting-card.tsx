import { useUser } from '@clerk/react'
import { Building2Icon, ShieldCheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function GreetingCard() {
  const { t } = useTranslation()
  const { user } = useUser()
  // Invited residents get their apartment from the invitation (public metadata)
  const apartment = user?.publicMetadata.apartment
  const firstName =
    user?.firstName || user?.fullName || user?.primaryEmailAddress?.emailAddress.split('@')[0]

  return (
    <section className="flex items-start gap-3 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="grid flex-1 gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {t('home.greeting', { name: firstName })}{' '}
          <span
            aria-hidden
            className="inline-block origin-[70%_70%] motion-safe:animate-[wave_1.8s_ease-in-out_1]"
          >
            👋
          </span>
        </h1>
        {apartment && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2Icon className="size-4 text-primary" />
            {t('home.apartment', { number: apartment })}
          </p>
        )}
      </div>
      <div
        title={t('home.verified')}
        className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary dark:bg-primary-950"
      >
        <ShieldCheckIcon className="size-5" />
        <span className="sr-only">{t('home.verified')}</span>
      </div>
    </section>
  )
}
