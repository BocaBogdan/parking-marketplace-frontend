import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { BuildingFeatureFlag } from '@/types/models'

/** Spots register without a proof PDF and are approved at once; admins can still reject them */
export const SPOT_DOCUMENT_NOT_REQUIRED = 'SPOT_DOCUMENT_NOT_REQUIRED'

/** Keys of the flags turned on in the signed-in user's building */
export const currentFeatureFlagsQuery = queryOptions({
  queryKey: ['feature-flags', 'current'],
  queryFn: () => unwrap<string[]>(api.GET('/api/feature-flags/current')),
})

/** Every flag defined in the backend, with whether this building has it on */
export function buildingFeatureFlagsQuery(buildingId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'feature-flags'],
    queryFn: () =>
      unwrap<BuildingFeatureFlag[]>(
        api.GET('/api/building/{buildingId}/feature-flags', {
          params: { path: { buildingId } },
        }),
      ),
  })
}

/** Admins only */
export function setBuildingFeatureFlag(buildingId: string, key: string, enabled: boolean) {
  return unwrap<{ key: string; enabled: boolean }>(
    api.PUT('/api/building/{buildingId}/feature-flags/{key}', {
      params: { path: { buildingId, key } },
      body: { enabled },
    }),
  )
}
