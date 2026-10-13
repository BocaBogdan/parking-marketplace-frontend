/**
 * Response shapes of parking-marketplace-backend-js, written by hand from its TypeORM
 * entities. TODO: the backend declares no response schemas yet, so `src/types/api.ts`
 * types every response body as `never`. Once controllers add `@ApiOkResponse({ type })`,
 * re-run `npm run gen:api` and replace these with `components['schemas'][…]`.
 *
 * Dates are serialized ISO strings.
 */
import type { components } from '@/types/api'

export type SpotStatus = NonNullable<components['schemas']['UpdateSpotDto']['status']>

export interface Spot {
  id: string
  /** Clerk user id of the owner */
  userId: string
  buildingId: string
  number: number
  description: string
  createdAt: string
  updatedAt: string
}

/**
 * Not in the first release: the backend dropped a spot's location, review status and
 * proof document. Kept for the parked review components (map picker, document preview,
 * approve/reject) so they can come back with the API.
 */
export interface ReviewableSpot extends Spot {
  long: string
  lat: string
  /** R2 key of the PDF proving the owner has the right to the spot */
  fileId: string
  status: SpotStatus
}

/** One day's available hours of a spot, repeating every week */
export interface Schedule {
  id: string
  spotId: string
  /** 0 = Sunday … 6 = Saturday, like `Date.getDay()` */
  dayOfWeek: number
  /** Minutes since midnight, Romanian time */
  startMinute: number
  /** Minutes since midnight; 1440 means "until midnight" */
  endMinute: number
  createdAt: string
  updatedAt: string
}

export interface Car {
  id: string
  /** Clerk user id of the driver */
  userId: string
  phone: string
  plate: string
  description: string
  createdAt: string
  updatedAt: string
}

export interface Building {
  id: string
  name: string
  description: string
  createdAt: string
  updatedAt: string
}

export type OverrideType = 'FREE' | 'BUSY'

/**
 * A temporary change to a spot's weekly schedule: free outside its hours, or blocked
 * inside them. Starts when created; `endsAt` null means until the owner ends it.
 */
export interface SpotOverride {
  id: string
  spotId: string
  type: OverrideType
  startsAt: string
  endsAt: string | null
  createdAt: string
}

/** A booked weekday slot of a spot (the backend stores no date, only the weekday) */
export interface Booking {
  id: string
  /** Clerk user id of the driver */
  userId: string
  spotId: string
  carId: string
  /** 0 = Sunday … 6 = Saturday, like `Date.getDay()` */
  dayOfWeek: number
  startMinute: number
  endMinute: number
  createdAt: string
  updatedAt: string
}
