import { SignUp } from '@clerk/react'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AuthLayout } from '@/components/auth-layout'
import { isAuthenticated } from '@/lib/auth'

// Sign-up is invitation-only: the link in the invitation email lands here with a
// `__clerk_ticket` param, which <SignUp /> reads to verify the email and attach the
// invite's building and apartment (public metadata) to the new user.
export const Route = createFileRoute('/register')({
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: '/home' })
  },
  component: RegisterPage,
})

function RegisterPage() {
  const { t } = useTranslation()

  return (
    <AuthLayout>
      <div className="grid justify-items-center gap-4">
        <SignUp routing="hash" forceRedirectUrl="/home" />
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {t('terms.registerNotice')}{' '}
          <Link to="/terms" className="font-medium text-primary hover:underline">
            {t('terms.title').toLowerCase()}
          </Link>
          .
        </p>
      </div>
    </AuthLayout>
  )
}
