import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { BuildingFeatureFlag } from '@/types/models'

/** Spots register without a proof PDF and are approved at once; admins can still reject them */
export const SPOT_DOCUMENT_NOT_REQUIRED = 'SPOT_DOCUMENT_NOT_REQUIRED'

/**
 * Keys of the flags turned on in one of the user's buildings; without an id, the one they
 * joined first. The API refuses a building they aren't in.
 */
export function featureFlagsQuery(buildingId: string | undefined) {
  return queryOptions({
    queryKey: ['feature-flags', 'current', buildingId ?? null],
    queryFn: () =>
      unwrap<string[]>(
        api.GET('/api/feature-flags/current', { params: { query: { buildingId } } }),
      ),
  })
}

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
