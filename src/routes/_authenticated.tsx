import { createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/app-shell/app-shell'
import { ApiError } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import { meQuery } from '@/queries/me'
import { useBuildingStore } from '@/stores/building-store'

// Pathless layout: every route under _authenticated/ requires a signed-in user
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location, context: { queryClient } }) => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    // Before child guards, which read roles and buildings from it. The first call also
    // creates the user's account in the backend. Server and network errors are retried
    // before the error page shows.
    const me = await queryClient.query({
      ...meQuery,
      staleTime: 'static',
      retry: (failureCount, error) =>
        failureCount < 2 && !(error instanceof ApiError && error.status < 500),
    })
    // Forget a building they've since left
    const { selectedBuildingId, select } = useBuildingStore.getState()
    if (selectedBuildingId && !me.memberships.some((m) => m.buildingId === selectedBuildingId)) {
      select(null)
    }
  },
  component: AppShell,
})
