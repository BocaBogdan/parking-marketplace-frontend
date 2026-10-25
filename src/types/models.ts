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
  long: string
  lat: string
  /** R2 key of the PDF proving the owner has the right to the spot */
  fileId: string
  /** New and edited spots wait for an admin; only CONFIRMED ones can be booked */
  status: SpotStatus
  createdAt: string
  updatedAt: string
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

/** What the building admin endpoints return for a spot: with its owner's account */
export interface AdminSpot extends Spot {
  /** Null if the owner hasn't signed in since accounts moved to the backend */
  owner: AppUser | null
}

/** GET /admin/{buildingId}/spot/{id}: the spot, its owner and its weekly hours */
export interface AdminSpotDetail extends AdminSpot {
  schedules: Schedule[]
}

/** A reserved window of a spot. A window past midnight is still one booking. */
export interface Booking {
  id: string
  /** Clerk user id of the driver */
  userId: string
  spotId: string
  carId: string
  /** ISO instants (UTC) */
  startsAt: string
  endsAt: string
  createdAt: string
  updatedAt: string
}

/** A signed-up person; Clerk handles sign-in, the backend keeps what they may do */
export interface AppUser {
  /** Clerk user id */
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  /** Manages every building */
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export type MembershipRole = 'RESIDENT' | 'BUILDING_ADMIN'

/** A user's place in one building; a user can belong to several */
export interface BuildingMembership {
  id: string
  userId: string
  buildingId: string
  role: MembershipRole
  apartment: string
  eBlocUserID: string
  createdAt: string
}

/** What GET /user/me returns: the user with each building they belong to */
export interface Me extends AppUser {
  memberships: (BuildingMembership & { building: Building })[]
}

/** What GET /admin/{buildingId}/member returns: each resident with their account */
export interface BuildingMember extends BuildingMembership {
  user: AppUser
}

/** An invitation to a building that hasn't turned into a membership yet */
export interface BuildingInvite {
  id: string
  buildingId: string
  email: string
  role: MembershipRole
  apartment: string
  eBlocUserID: string
  /** Clerk user id of whoever sent it */
  invitedBy: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED'
  createdAt: string
}

/** The period statistics cover, back from now */
export type StatsRange = '30d' | '90d' | '12m' | 'all'

/** Durations in statistics are minutes, counting only the part of a booking inside the range */
export interface StatsKpis {
  bookings: number
  bookedMinutes: number
  /** Distinct residents who booked */
  drivers: number
  avgBookingMinutes: number
}

/** One timeline bar: a local day, week (from Monday) or month, by `bucketStart` ("2026-10-05") */
export interface StatsBucket {
  bucketStart: string
  bookings: number
  minutes: number
}

/** Average spots in use in one weekday × hour of the range (0 = Sunday, Bucharest time) */
export interface StatsHeatmapCell {
  dayOfWeek: number
  hour: number
  avgSpotsInUse: number
}

export interface StatsSpot {
  spotId: string
  number: number
  /** Name, or the email when the account has none; null if the owner isn't synced */
  ownerName: string | null
  bookings: number
  minutes: number
}

export interface StatsCar {
  carId: string
  /** Null once the driver has removed the car */
  plate: string | null
  description: string | null
  /** Only in building statistics */
  driverName?: string | null
  bookings: number
  minutes: number
}

export interface StatsUtilization {
  offeredMinutes: number
  bookedMinutes: number
}

/** GET /admin/{buildingId}/stats */
export interface BuildingStats {
  range: { from: string; to: string }
  kpis: StatsKpis & {
    /** Approved spots with weekly hours */
    activeSpots: number
  }
  topSpots: StatsSpot[]
  topCars: StatsCar[]
  timeline: StatsBucket[]
  heatmap: StatsHeatmapCell[]
  /** Approved spots, by number */
  utilization: (StatsUtilization & { spotId: string; number: number })[]
}

/** GET /spot/{id}/stats: the owner's view of one spot */
export interface SpotStats {
  range: { from: string; to: string }
  kpis: StatsKpis
  topCars: StatsCar[]
  timeline: StatsBucket[]
  heatmap: StatsHeatmapCell[]
  utilization: StatsUtilization
}
