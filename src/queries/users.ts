import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

// The backend has no /users/me yet, so read our id from the access token's `sub` claim
function currentUserId(): string {
  const token = useAuthStore.getState().accessToken
  if (!token) throw new Error('Not signed in')
  const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return (JSON.parse(atob(payload)) as { sub: string }).sub
}

export function currentUserQuery() {
  const userId = currentUserId()
  return queryOptions({
    queryKey: ['users', userId],
    queryFn: () =>
      unwrap(api.GET('/api/v1/users/{user_id}', { params: { path: { user_id: userId } } })),
  })
}
