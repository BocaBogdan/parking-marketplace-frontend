import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { currentBuildingId } from '@/lib/auth'
import { SLOT_MS, weeklyIntervals } from '@/lib/booking-window'
import type { components } from '@/types/api'
import type { Spot, SpotStatus } from '@/types/models'

export const mySpotsQuery = queryOptions({
  queryKey: ['spots', 'mine'],
  queryFn: async () => {
    const spots = await unwrap<Spot[]>(api.GET('/api/spot/mine'))
    return spots.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
})

/**
 * Spots with a schedule covering the whole window. The backend matches one
 * weekday at a time, so a window past midnight needs a match on each day it touches.
 * TODO: the backend doesn't subtract existing bookings yet, and doesn't limit results to
 * the user's building, so that's filtered here until it does.
 */
export function availableSpotsQuery(start: number, end: number) {
  return queryOptions({
    queryKey: ['spots', 'available', { start, end }],
    queryFn: async () => {
      const [first = [], ...rest] = await Promise.all(
        weeklyIntervals(start, end).map((query) =>
          unwrap<Spot[]>(api.GET('/api/spot/available', { params: { query } })),
        ),
      )
      const freeOnOtherDays = rest.map((spots) => new Set(spots.map((spot) => spot.id)))
      // Residents share spots within their own building only
      const buildingId = currentBuildingId()
      return first
        .filter((spot) => !buildingId || spot.buildingId === buildingId)
        .filter((spot) => freeOnOtherDays.every((free) => free.has(spot.id)))
        .sort((a, b) => a.number - b.number)
    },
  })
}

/** Spots free for the 30-minute slot we're currently in. Aligning to the slot keeps the key stable. */
export function currentSlotAvailabilityQuery(now: number) {
  const start = Math.floor(now / SLOT_MS) * SLOT_MS
  return availableSpotsQuery(start, start + SLOT_MS)
}

type SpotFields = Pick<Spot, 'number' | 'description'>

export function createSpot(body: SpotFields) {
  return unwrap<Spot>(
    api.POST('/api/spot', {
      // TODO: CreateSpotDto still declares `location`, but the first release has none and
      // the backend accepts a spot without it. Drop the cast once the DTO loses the field.
      body: body as components['schemas']['CreateSpotDto'],
    }),
  )
}

/** Fields left out stay as they are */
export function updateSpot(spotId: string, body: Partial<SpotFields>) {
  return unwrap<Spot>(api.PATCH('/api/spot/{id}', { params: { path: { id: spotId } }, body }))
}

/**
 * Not in the first release. The multipart body the spot form sent while spots had a
 * location and a proof document: the PDF is the `file` part, and `location[lat]` /
 * `location[long]` arrive as the nested `location` object (multer parses the brackets).
 */
export function spotFormData(fields: {
  number?: number
  description?: string
  location?: components['schemas']['LocationDto']
  status?: SpotStatus
  document?: File
}) {
  const form = new FormData()
  if (fields.number !== undefined) form.append('number', String(fields.number))
  if (fields.description !== undefined) form.append('description', fields.description)
  if (fields.location) {
    form.append('location[lat]', fields.location.lat)
    form.append('location[long]', fields.location.long)
  }
  if (fields.status) form.append('status', fields.status)
  if (fields.document) form.append('file', fields.document, fields.document.name)
  return form
}

export function deleteSpot(spotId: string) {
  return unwrap(api.DELETE('/api/spot/{id}', { params: { path: { id: spotId } } }))
}
