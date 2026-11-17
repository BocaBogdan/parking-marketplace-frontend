import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { Me } from '@/types/models'

/**
 * The signed-in user and their buildings. The first call also creates their account in
 * the backend and turns their pending invites into memberships. Roles come from here
 * (see lib/auth), not from Clerk.
 */
export const meQuery = queryOptions({
  queryKey: ['me'],
  queryFn: () => unwrap<Me>(api.GET('/api/user/me')),
})
