import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { components } from '@/types/api'
import type { Community } from '@/types/models'

export const communitiesQuery = queryOptions({
  queryKey: ['communities'],
  queryFn: () => unwrap<Community[]>(api.GET('/api/admin/community')),
})

export function createCommunity(body: components['schemas']['CreateCommunityDto']) {
  return unwrap<Community>(api.POST('/api/admin/community', { body }))
}

export function renameCommunity(id: string, name: string) {
  return unwrap<Community>(
    api.PATCH('/api/admin/community/{id}', { params: { path: { id } }, body: { name } }),
  )
}

/** Its buildings stay, each on its own again; bookings are kept */
export function deleteCommunity(id: string) {
  return unwrap<unknown>(api.DELETE('/api/admin/community/{id}', { params: { path: { id } } }))
}

export function addCommunityBuilding(id: string, buildingId: string) {
  return unwrap<Community>(
    api.POST('/api/admin/community/{id}/building/{buildingId}', {
      params: { path: { id, buildingId } },
    }),
  )
}

/** A community left with one building is deleted */
export function removeCommunityBuilding(id: string, buildingId: string) {
  return unwrap<unknown>(
    api.DELETE('/api/admin/community/{id}/building/{buildingId}', {
      params: { path: { id, buildingId } },
    }),
  )
}
