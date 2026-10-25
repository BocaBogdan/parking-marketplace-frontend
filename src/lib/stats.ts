import type { StatsRange, StatsUtilization } from '@/types/models'

export const STATS_RANGES = ['30d', '90d', '12m', 'all'] as const satisfies StatsRange[]

/** The backend buckets 30 days by day, 90 days by week and longer ranges by month */
export type BucketUnit = 'day' | 'week' | 'month'
export const bucketUnit = (range: StatsRange): BucketUnit =>
  range === '30d' ? 'day' : range === '90d' ? 'week' : 'month'

/** Booked ÷ offered, capped at 100% (bookings can outlast hours the owner cut since) */
export const utilizationOf = ({ offeredMinutes, bookedMinutes }: StatsUtilization) =>
  offeredMinutes > 0 ? Math.min(1, bookedMinutes / offeredMinutes) : undefined
