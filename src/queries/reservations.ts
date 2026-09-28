import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { components } from '@/types/api'

type Reservation = components['schemas']['ReservationRead']

export const myReservationsQuery = queryOptions({
  queryKey: ['reservations', 'mine'],
  queryFn: () => unwrap(api.GET('/api/v1/reservations/mine')),
})

/** Confirmed reservations that haven't ended yet, soonest first */
export function upcomingReservations(reservations: Reservation[], now: number) {
  return reservations
    .filter((r) => r.status === 'CONFIRMED' && new Date(r.end_at).getTime() > now)
    .sort((a, b) => a.start_at.localeCompare(b.start_at))
}

/** One reservation covering the whole window (both ends on :00 or :30) */
export function createReservation(body: components['schemas']['ReservationCreate']) {
  return unwrap(api.POST('/api/v1/reservations/', { body }))
}
