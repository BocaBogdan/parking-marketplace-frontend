import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { BuildingInvite, BuildingMember, MembershipRole } from '@/types/models'

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

/** Makes a member building admin or resident (admins only) */
export function updateMemberRole(buildingId: string, membershipId: string, role: MembershipRole) {
  return unwrap<BuildingMember>(
    api.PATCH('/api/admin/{buildingId}/member/{membershipId}', {
      params: { path: { buildingId, membershipId } },
      body: { role },
    }),
  )
}

/** What removing a member changed */
export interface MemberRemoval {
  spotsDeleted: number
  spotsKept: number
  bookingsCancelled: number
}

/**
 * Takes a member out of the building: admins anyone, building admins only residents (not
 * themselves). Their spots go to a flatmate who stays or are deleted; their upcoming
 * bookings there are cancelled.
 */
export function removeMember(buildingId: string, membershipId: string) {
  return unwrap<MemberRemoval>(
    api.DELETE('/api/admin/{buildingId}/member/{membershipId}', {
      params: { path: { buildingId, membershipId } },
    }),
  )
}

/** Emails a fresh link for a pending invite, e.g. after the old one expired */
export function resendInvite(buildingId: string, inviteId: string) {
  return unwrap<BuildingInvite>(
    api.POST('/api/admin/{buildingId}/invite/{inviteId}/resend', {
      params: { path: { buildingId, inviteId } },
    }),
  )
}

/** Cancels a pending invite: its link stops working and the email can be invited again */
export function revokeInvite(buildingId: string, inviteId: string) {
  return unwrap<unknown>(
    api.DELETE('/api/admin/{buildingId}/invite/{inviteId}', {
      params: { path: { buildingId, inviteId } },
    }),
  )
}
