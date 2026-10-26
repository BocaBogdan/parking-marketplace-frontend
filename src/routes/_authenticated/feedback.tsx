import { useState } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { ExternalLinkIcon, Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { env } from '@/lib/env'

export const Route = createFileRoute('/_authenticated/feedback')({
  beforeLoad: () => {
    if (!env.feedbackFormUrl) throw notFound()
  },
  component: FeedbackPage,
})

function FeedbackPage() {
  const { t } = useTranslation()
  const [isLoaded, setIsLoaded] = useState(false)
  const formUrl = env.feedbackFormUrl!

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-2xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('feedback.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('feedback.description')}</p>
          {env.donationUrl && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t('feedback.donate')}{' '}
              <a
                href={env.donationUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {t('feedback.donateLink')}
              </a>
            </p>
          )}
        </div>
        {/* For anyone whose browser blocks Google's embed (e.g. third-party cookies off) */}
        <a
          href={formUrl.replace('?embedded=true', '')}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          {t('feedback.openInNewTab')}
          <ExternalLinkIcon className="size-4" />
        </a>
      </header>

      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-xs">
        {!isLoaded && (
          <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2Icon className="size-5 animate-spin" />
            {t('feedback.loading')}
          </div>
        )}
        <iframe
          src={formUrl}
          title={t('feedback.title')}
          height="100%"
          onLoad={() => setIsLoaded(true)}
          className="block h-[80vh] w-full border-0"
        />
      </div>
    </div>
  )
}
