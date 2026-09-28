import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell/app-shell'
import { isAuthenticated } from '@/lib/auth'
import { currentUserQuery } from '@/queries/users'

// Pathless layout: every route under _authenticated/ requires a signed-in user
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  loader: ({ context }) =>
    context.queryClient.query({ ...currentUserQuery(), staleTime: 'static' }),
  component: AppShell,
})
