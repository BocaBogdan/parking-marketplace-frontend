import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { toReservation, type OwnerReservation } from '@/queries/reservations'
import type { AdminSpot, AdminSpotDetail, AppUser, Booking, Car, SpotStatus } from '@/types/models'

/** Every spot registered in a building with its owner, by number (admins and its building admin) */
export function buildingSpotsQuery(buildingId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'spots'],
    queryFn: () =>
      unwrap<AdminSpot[]>(
        api.GET('/api/admin/{buildingId}/spot', { params: { path: { buildingId } } }),
      ),
  })
}

/** One spot of the building with its owner and weekly hours; 404s for other buildings' spots */
export function buildingSpotQuery(buildingId: string, spotId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'spots', spotId],
    queryFn: () =>
      unwrap<AdminSpotDetail>(
        api.GET('/api/admin/{buildingId}/spot/{id}', {
          params: { path: { buildingId, id: spotId } },
        }),
      ),
  })
}

/** A booking as the building admin sees it: who booked, and which car is parked */
export interface AdminReservation extends OwnerReservation {
  /** Undefined if the driver hasn't signed in since accounts moved to the backend */
  driver: AppUser | undefined
}

type AdminSpotBooking = Booking & { car: Car | null; driver: AppUser | null }

/** Every booking of a spot of the building, soonest first */
export function buildingSpotReservationsQuery(buildingId: string, spotId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'spots', spotId, 'reservations'],
    queryFn: async (): Promise<AdminReservation[]> => {
      const bookings = await unwrap<AdminSpotBooking[]>(
        api.GET('/api/admin/{buildingId}/spot/{id}/booking', {
          params: { path: { buildingId, id: spotId } },
        }),
      )
      return bookings.map((booking) => ({
        ...toReservation(booking),
        car: booking.car ?? undefined,
        driver: booking.driver ?? undefined,
      }))
    },
  })
}

/** Approve (CONFIRMED) or reject (REJECTED) a spot; responds with no spot, so refetch */
export function setSpotStatus(buildingId: string, spotId: string, status: SpotStatus) {
  return unwrap(
    api.PATCH('/api/admin/{buildingId}/spot/{id}/status', {
      params: { path: { buildingId, id: spotId } },
      body: { status },
    }),
  )
}

// Presigned URLs expire, so never show one from the cache for long
const DOCUMENT_URL_STALE_MS = 60 * 1000

/**
 * A short-lived link to a spot's proof of ownership. `fileId` is its storage key; the backend
 * only signs keys that belong to a spot of this building.
 */
export function documentUrlQuery(buildingId: string, fileId: string) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'documents', fileId],
    queryFn: () =>
      unwrap<string>(
        api.GET('/api/admin/{buildingId}/document/{docId}', {
          params: { path: { buildingId, docId: fileId } },
          // The backend answers with the bare URL, not JSON
          parseAs: 'text',
        }),
      ),
    staleTime: DOCUMENT_URL_STALE_MS,
    gcTime: DOCUMENT_URL_STALE_MS,
  })
}
