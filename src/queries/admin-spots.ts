import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { Spot, SpotStatus } from '@/types/models'

/** Every spot registered in a building, whatever its status (admin only) */
export function buildingSpotsQuery(buildingId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'spots'],
    queryFn: async () => {
      const spots = await unwrap<Spot[]>(
        api.GET('/api/admin/{buildingId}/spot', { params: { path: { buildingId } } }),
      )
      return spots.sort((a, b) => a.number - b.number)
    },
  })
}

/** Approve (CONFIRMED) or reject (REJECTED) a spot; responds with no spot, so refetch */
export function setSpotStatus(buildingId: string, spotId: string, status: SpotStatus) {
  return unwrap(
    api.PATCH('/api/admin/{buildingId}/spot/{id}/status', {
      // TODO: the URL has {buildingId}, but the controller doesn't read it, so the spec only
      // declares `id`. Drop the cast once the controller adds @ApiParam({ name: 'buildingId' }).
      params: { path: { id: spotId, buildingId } as { id: string } },
      body: { status },
    }),
  )
}

// Presigned URLs expire, so never show one from the cache for long
const DOCUMENT_URL_STALE_MS = 60 * 1000

/**
 * A short-lived link to a stored document, e.g. a spot's proof of ownership. `fileId` is
 * the storage key (`spots/<uuid>.pdf`); the route takes only the file name and the backend
 * adds the folder back.
 */
export function documentUrlQuery(fileId: string) {
  const docId = fileId.split('/').at(-1) ?? fileId
  return queryOptions({
    queryKey: ['documents', docId],
    queryFn: () =>
      unwrap<string>(
        api.GET('/api/document/{docId}', {
          params: { path: { docId } },
          // The backend answers with the bare URL, not JSON
          parseAs: 'text',
        }),
      ),
    staleTime: DOCUMENT_URL_STALE_MS,
    gcTime: DOCUMENT_URL_STALE_MS,
  })
}
