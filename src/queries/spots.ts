import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'

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
  return availableSpotsQuery(new Date(start).toISOString(), new Date(start + SLOT_MS).toISOString())
}
