import { api, unwrap } from '@/lib/api'
import type { components } from '@/types/api'

export type Invite = components['schemas']['InviteUserDto']

/**
 * Clerk emails an invitation; the backend stores the fields plus the building as the
 * user's public metadata
 */
export function inviteResident(buildingId: string, body: Invite) {
  return unwrap(
    api.POST('/api/admin/{buildingId}/invite', { params: { path: { buildingId } }, body }),
  )
}

export function inviteResidents(buildingId: string, invites: Invite[]) {
  return unwrap(
    api.POST('/api/admin/{buildingId}/invite/bulk', {
      params: { path: { buildingId } },
      body: { invites },
    }),
  )
}
