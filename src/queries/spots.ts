import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { toZonedIso } from '@/lib/format'
import type { components } from '@/types/api'

export const mySpotsQuery = queryOptions({
  queryKey: ['spots', 'mine'],
  queryFn: () => unwrap(api.GET('/api/v1/spots/mine')),
})

export function availableSpotsQuery(from: string, to: string) {
  return queryOptions({
    queryKey: ['spots', 'available', { from, to }],
    queryFn: () => unwrap(api.GET('/api/v1/spots/available', { params: { query: { from, to } } })),
  })
}

const SLOT_MS = 30 * 60 * 1000

/** Spots free for the 30-minute slot we're currently in. Aligning to the slot keeps the key stable. */
export function currentSlotAvailabilityQuery(now: number) {
  const start = Math.floor(now / SLOT_MS) * SLOT_MS
  return availableSpotsQuery(toZonedIso(start), toZonedIso(start + SLOT_MS))
}

type SpotCreate = components['schemas']['SpotCreate']
type SpotUpdate = components['schemas']['SpotUpdate']

export function createSpot(body: SpotCreate) {
  return unwrap(api.POST('/api/v1/spots/', { body }))
}

/** Updating a REJECTED spot resubmits it: the backend moves it back to PENDING */
export function updateSpot(spotId: string, body: SpotUpdate) {
  return unwrap(api.PUT('/api/v1/spots/{spot_id}', { params: { path: { spot_id: spotId } }, body }))
}

export function deleteSpot(spotId: string) {
  return unwrap(api.DELETE('/api/v1/spots/{spot_id}', { params: { path: { spot_id: spotId } } }))
}
