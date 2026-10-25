import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { BuildingInvite, BuildingMember } from '@/types/models'

/** A building's residents, earliest first (admins and its building admin) */
export function buildingMembersQuery(buildingId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'members'],
    queryFn: () =>
      unwrap<BuildingMember[]>(
        api.GET('/api/admin/{buildingId}/member', { params: { path: { buildingId } } }),
      ),
  })
}

/** Invitations to a building that no one has accepted yet */
export function pendingInvitesQuery(buildingId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'invites'],
    queryFn: () =>
      unwrap<BuildingInvite[]>(
        api.GET('/api/admin/{buildingId}/invite', { params: { path: { buildingId } } }),
      ),
  })
}
