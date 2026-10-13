import { SignIn } from '@clerk/react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthLayout } from '@/components/auth-layout'
import { authSearchSchema, isAuthenticated } from '@/lib/auth'

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  beforeLoad: ({ search }) => {
    if (isAuthenticated()) throw redirect({ href: search.redirect ?? '/home' })
  },
  component: LoginPage,
})

function LoginPage() {
  const search = Route.useSearch()

  return (
    <AuthLayout>
      {/* Hash routing keeps Clerk's extra steps (second factor, reset password) on this route */}
      <SignIn routing="hash" forceRedirectUrl={search.redirect ?? '/home'} />
    </AuthLayout>
  )
}
