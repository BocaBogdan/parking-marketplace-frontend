import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { currentBuildingId } from '@/lib/auth'
import { SLOT_MS } from '@/lib/booking-window'
import type { components } from '@/types/api'
import type { Spot, SpotStats, StatsRange } from '@/types/models'

export const mySpotsQuery = queryOptions({
  queryKey: ['spots', 'mine'],
  queryFn: async () => {
    const spots = await unwrap<Spot[]>(api.GET('/api/spot/mine'))
    return spots.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
})

/**
 * Approved spots whose schedule covers the whole window (even past midnight) and that
 * nobody has booked for any part of it, by spot number.
 * TODO: the backend doesn't limit results to the user's building yet, so that's filtered here.
 */
export function availableSpotsQuery(start: number, end: number) {
  return queryOptions({
    queryKey: ['spots', 'available', { start, end }],
    queryFn: async () => {
      const spots = await unwrap<Spot[]>(
        api.GET('/api/spot/available', {
          params: {
            query: { startsAt: new Date(start).toISOString(), endsAt: new Date(end).toISOString() },
          },
        }),
      )
      // Residents share spots within their own building only
      const buildingId = currentBuildingId()
      return spots.filter((spot) => !buildingId || spot.buildingId === buildingId)
    },
  })
}

/** The owner's statistics for one of their spots */
export function spotStatsQuery(spotId: string, range: StatsRange) {
  return queryOptions({
    queryKey: ['spots', spotId, 'stats', range],
    queryFn: () =>
      unwrap<SpotStats>(
        api.GET('/api/spot/{id}/stats', { params: { path: { id: spotId }, query: { range } } }),
      ),
  })
}

/** Spots free for the 30-minute slot we're currently in. Aligning to the slot keeps the key stable. */
export function currentSlotAvailabilityQuery(now: number) {
  const start = Math.floor(now / SLOT_MS) * SLOT_MS
  return availableSpotsQuery(start, start + SLOT_MS)
}

type SpotFields = Pick<Spot, 'number' | 'description'>

/**
 * Registers a spot for review. The body is multipart: the proof PDF is the `file` part, and
 * `location[lat]` / `location[long]` arrive as the nested `location` object (multer parses
 * the brackets).
 */
export function createSpot(
  fields: SpotFields & { location: components['schemas']['LocationDto']; document: File },
) {
  const form = new FormData()
  form.append('number', String(fields.number))
  form.append('description', fields.description)
  form.append('location[lat]', fields.location.lat)
  form.append('location[long]', fields.location.long)
  form.append('file', fields.document, fields.document.name)
  return unwrap<Spot>(
    api.POST('/api/spot', {
      // openapi-fetch sends FormData as is, letting the browser set the multipart boundary
      body: form as unknown as components['schemas']['CreateSpotDto'],
    }),
  )
}

/**
 * Fields left out stay as they are. Any edit sends the spot back to PENDING for review.
 * TODO: the backend spreads the body straight into the entity, so `location` (not a column)
 * would fail, and PATCH takes no file. Add both once the endpoint maps them.
 */
export function updateSpot(spotId: string, body: Partial<SpotFields>) {
  return unwrap<Spot>(api.PATCH('/api/spot/{id}', { params: { path: { id: spotId } }, body }))
}

export function deleteSpot(spotId: string) {
  return unwrap(api.DELETE('/api/spot/{id}', { params: { path: { id: spotId } } }))
}
