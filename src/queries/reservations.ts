import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { SLOT_MS, weeklyIntervals } from '@/lib/booking-window'
import { addDays, parseApiDate, zonedDayKey, zonedToMs } from '@/lib/format'
import { displayTime, MINUTES_PER_DAY } from '@/lib/schedule'
import type { Booking, Car } from '@/types/models'

/**
 * A reserved window, rebuilt from the backend's bookings. The API stores a weekday and
 * minutes but no date (see `bookingDate`), and a window past midnight is two bookings.
 */
export interface Reservation {
  /** The first booking's id */
  id: string
  /** Every booking behind it: two when the window crosses midnight */
  bookingIds: string[]
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

function instantAt(day: string, minutes: number) {
  return minutes === MINUTES_PER_DAY
    ? zonedToMs(addDays(day, 1), '00:00')
    : zonedToMs(day, displayTime(minutes))
}

/**
 * TODO: the backend should store the booked date (or start/end instants) instead.
 * Until then, infer it: reservations always start within the next two days, so a booking
 * is for the first day with its weekday whose window ends after the booking was made.
 */
function toInterval(booking: Booking) {
  const createdAt = parseApiDate(booking.createdAt)
  const createdDay = zonedDayKey(createdAt)
  for (let offset = 0; offset < 8; offset++) {
    const day = addDays(createdDay, offset)
    if (new Date(`${day}T00:00:00Z`).getUTCDay() !== booking.dayOfWeek) continue
    const end = instantAt(day, booking.endMinute)
    // A slot boundary of leeway: the booking can be saved a moment after its start
    if (end > createdAt - SLOT_MS) return { start: instantAt(day, booking.startMinute), end }
  }
  // Unreachable: every weekday occurs within a week
  throw new Error(`No date for booking ${booking.id}`)
}

/** Dated reservations, soonest first, with the two halves of overnight windows joined */
function toReservations(bookings: Booking[]): Reservation[] {
  const reservations = bookings
    .map((booking) => ({
      id: booking.id,
      bookingIds: [booking.id],
      spotId: booking.spotId,
      carId: booking.carId,
      userId: booking.userId,
      ...toInterval(booking),
    }))
    .sort((a, b) => a.start - b.start)

  const joined: Reservation[] = []
  for (const reservation of reservations) {
    const previous = joined.at(-1)
    const continues =
      previous &&
      previous.end === reservation.start &&
      previous.spotId === reservation.spotId &&
      previous.carId === reservation.carId &&
      previous.userId === reservation.userId
    if (continues) {
      previous.end = reservation.end
      previous.bookingIds.push(reservation.id)
    } else {
      joined.push(reservation)
    }
  }
  return joined
}

export const myReservationsQuery = queryOptions({
  queryKey: ['reservations', 'mine'],
  queryFn: async () => toReservations(await unwrap<Booking[]>(api.GET('/api/booking/mine'))),
})

/** What GET /spot/{id}/booking returns: the spot's bookings, each with the car parked */
type SpotBooking = Booking & { car: Car | null }

/** Owner-only: bookings of a spot, with the car (plate and phone) parked in it */
export function spotReservationsQuery(spotId: string) {
  return queryOptions({
    queryKey: ['spots', spotId, 'reservations'],
    queryFn: async (): Promise<OwnerReservation[]> => {
      const bookings = await unwrap<SpotBooking[]>(
        api.GET('/api/spot/{id}/booking', { params: { path: { id: spotId } } }),
      )
      const carOf = new Map(bookings.map((booking) => [booking.carId, booking.car]))
      return toReservations(bookings).map((reservation) => ({
        ...reservation,
        car: carOf.get(reservation.carId) ?? undefined,
      }))
    },
  })
}

/** Reservations that haven't ended yet, soonest first */
export function upcomingReservations(reservations: Reservation[], now: number) {
  return reservations.filter((r) => r.end > now).sort((a, b) => a.start - b.start)
}

/** Removes every booking behind the reservation */
export async function cancelReservation(reservation: Reservation) {
  await Promise.all(
    reservation.bookingIds.map((id) =>
      unwrap(api.DELETE('/api/booking/{id}', { params: { path: { id } } })),
    ),
  )
}

interface NewReservation {
  spotId: string
  carId: string
  /** The window, as instants */
  start: number
  end: number
}

/**
 * Books a window. The backend books weekday slots, so a window past midnight becomes two
 * bookings; if the second fails, the first is removed again so nothing half-booked remains.
 */
export async function createReservation({ spotId, carId, start, end }: NewReservation) {
  const created: Booking[] = []
  try {
    for (const interval of weeklyIntervals(start, end)) {
      const booking = await unwrap<Booking>(
        api.POST('/api/booking', { body: { spotId, carId, ...interval } }),
      )
      created.push(booking)
    }
  } catch (error) {
    await Promise.allSettled(
      created.map((booking) =>
        api.DELETE('/api/booking/{id}', { params: { path: { id: booking.id } } }),
      ),
    )
    throw error
  }
  return created
}
