import type { ReactNode } from 'react'
import { ClerkFailed, ClerkLoaded, ClerkProvider } from '@clerk/react'
import { enUS, roRO } from '@clerk/localizations'
import { shadcn } from '@clerk/themes'
import { useTranslation } from 'react-i18next'
import { env } from '@/lib/env'

interface AuthProviderProps {
  /** Clerk's own redirects (after sign-in, sign-up, sign-out) go through the router */
  navigate: (href: string, options: { replace: boolean }) => unknown
  children: ReactNode
}

/** Clerk session and UI, in the app's language and theme */
export function AuthProvider({ navigate, children }: AuthProviderProps) {
  const { t, i18n } = useTranslation()

  return (
    <ClerkProvider
      publishableKey={env.clerkPublishableKey}
      localization={i18n.resolvedLanguage === 'ro' ? roRO : enUS}
      appearance={{ theme: shadcn }}
      signInUrl="/login"
      signUpUrl="/register"
      afterSignOutUrl="/login"
      routerPush={(href) => navigate(href, { replace: false })}
      routerReplace={(href) => navigate(href, { replace: true })}
    >
      {/* Route guards read the session synchronously, so wait until Clerk knows it */}
      <ClerkLoaded>{children}</ClerkLoaded>
      <ClerkFailed>
        <div className="flex min-h-svh items-center justify-center px-4 text-center">
          <p className="text-muted-foreground">{t('errors.network')}</p>
        </div>
      </ClerkFailed>
    </ClerkProvider>
  )
}
