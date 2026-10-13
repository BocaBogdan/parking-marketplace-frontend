import { SignUp } from '@clerk/react'
import { createFileRoute, redirect } from '@tanstack/react-router'
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
  return (
    <AuthLayout>
      <SignUp routing="hash" forceRedirectUrl="/home" />
    </AuthLayout>
  )
}
