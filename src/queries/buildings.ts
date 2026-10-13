import { isNotFound, notFound } from '@tanstack/react-router'
import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { components } from '@/types/api'
import type { Building } from '@/types/models'

export const buildingsQuery = queryOptions({
  queryKey: ['buildings'],
  queryFn: async () => {
    const buildings = await unwrap<Building[]>(api.GET('/api/building'))
    return buildings.sort((a, b) => a.name.localeCompare(b.name))
  },
})

export function buildingQuery(buildingId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId],
    queryFn: async () => {
      // The backend answers an unknown id with 200 and an empty body
      const building = await unwrap<Building | undefined>(
        api.GET('/api/building/{id}', { params: { path: { id: buildingId } } }),
      )
      if (!building) throw notFound()
      return building
    },
    // Retrying won't make a missing building appear
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 3,
  })
}

export function createBuilding(body: components['schemas']['CreateBuildingDto']) {
  return unwrap<Building>(api.POST('/api/building', { body }))
}
