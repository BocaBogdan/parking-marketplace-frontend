import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell/app-shell'
import { isAuthenticated } from '@/lib/auth'
import { meQuery } from '@/queries/me'

// Pathless layout: every route under _authenticated/ requires a signed-in user
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  // Also creates the user's account in the backend on their first visit
  loader: ({ context: { queryClient } }) => queryClient.query({ ...meQuery, staleTime: 'static' }),
  component: AppShell,
})
