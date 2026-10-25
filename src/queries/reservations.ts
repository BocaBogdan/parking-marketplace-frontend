import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { parseApiDate } from '@/lib/format'
import type { Booking, Car } from '@/types/models'

/** A reserved window, with its instants as epoch ms */
export interface Reservation {
  id: string
  spotId: string
  carId: string
  /** Clerk user id of the driver */
  userId: string
  start: number
  end: number
}

/** A booking of one of the user's spots, with the car parked in it */
export interface OwnerReservation extends Reservation {
  /** Undefined if the driver has since removed the car */
  car: Car | undefined
}

export function toReservation(booking: Booking): Reservation {
  return {
    id: booking.id,
    spotId: booking.spotId,
    carId: booking.carId,
    userId: booking.userId,
    start: parseApiDate(booking.startsAt),
    end: parseApiDate(booking.endsAt),
  }
}

/** Soonest first */
export const myReservationsQuery = queryOptions({
  queryKey: ['reservations', 'mine'],
  queryFn: async () => (await unwrap<Booking[]>(api.GET('/api/booking/mine'))).map(toReservation),
})

/** What GET /spot/{id}/booking returns: the spot's bookings, each with the car parked */
type SpotBooking = Booking & { car: Car | null }

/** Owner-only: bookings of a spot, soonest first, with the car (plate and phone) parked in it */
export function spotReservationsQuery(spotId: string) {
  return queryOptions({
    queryKey: ['spots', spotId, 'reservations'],
    queryFn: async (): Promise<OwnerReservation[]> => {
      const bookings = await unwrap<SpotBooking[]>(
        api.GET('/api/spot/{id}/booking', { params: { path: { id: spotId } } }),
      )
      return bookings.map((booking) => ({
        ...toReservation(booking),
        car: booking.car ?? undefined,
      }))
    },
  })
}

/** Reservations that haven't ended yet, soonest first */
export function upcomingReservations(reservations: Reservation[], now: number) {
  return reservations.filter((r) => r.end > now).sort((a, b) => a.start - b.start)
}

export function cancelReservation(reservation: Reservation) {
  return unwrap(api.DELETE('/api/booking/{id}', { params: { path: { id: reservation.id } } }))
}

interface NewReservation {
  spotId: string
  carId: string
  /** The window, as instants */
  start: number
  end: number
}

/**
 * Books a window, which may run past midnight. Fails with 409 if the spot was booked for
 * an overlapping window meanwhile, or its schedule no longer covers it.
 */
export function createReservation({ spotId, carId, start, end }: NewReservation) {
  return unwrap<Booking>(
    api.POST('/api/booking', {
      body: {
        spotId,
        carId,
        startsAt: new Date(start).toISOString(),
        endsAt: new Date(end).toISOString(),
      },
    }),
  )
}
