import { addDays, zonedClock, zonedDayKey, zonedToMs } from '@/lib/format'

/** Bookings are made of 30-minute slots aligned to :00 and :30 */
export const SLOT_MS = 30 * 60 * 1000
const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000

/** Start of the next bookable slot (Bucharest is a whole-hour offset, so UTC alignment matches) */
export function nextSlotStart(now: number) {
  return Math.ceil(now / SLOT_MS) * SLOT_MS
}

/** How many days ahead, today included, a spot can be searched for and reserved */
export const BOOKING_DAYS = 14
/** Where a window on a later day starts until the user picks a time */
const DEFAULT_START = '08:00'

/** The window as it lives in the URL: start is always on `date`, end on it or the next day */
export interface WindowSearch {
  /** "2026-10-28"; omitted means the first bookable day */
  date?: string
  from?: string
  to?: string
  toNextDay?: boolean
}

export interface BookingWindow {
  start: number
  end: number
  /** The day the window starts on */
  day: string
}

function isClock(value: string | undefined): value is string {
  return !!value && /^([01]\d|2[0-3]):(00|30)$/.test(value)
}

/** Bookable days, from today (tomorrow after 23:30) for BOOKING_DAYS days */
export function dayOptions(now: number) {
  const first = zonedDayKey(nextSlotStart(now))
  return Array.from({ length: BOOKING_DAYS }, (_, offset) => addDays(first, offset))
}

/** Turns URL params into instants, falling back to sensible defaults for missing/stale values */
export function resolveWindow(search: WindowSearch, now: number): BookingWindow {
  const days = dayOptions(now)
  const day = search.date && days.includes(search.date) ? search.date : days[0]
  // Today starts at the next slot; later days at midnight
  const earliest = Math.max(nextSlotStart(now), zonedToMs(day, '00:00'))

  let start = zonedToMs(day, isClock(search.from) ? search.from : DEFAULT_START)
  if (!isClock(search.from) && day === days[0]) start = earliest
  if (start < earliest) start = earliest

  let end = isClock(search.to)
    ? zonedToMs(search.toNextDay ? addDays(day, 1) : day, search.to)
    : start + DEFAULT_LENGTH_MS
  const latestEnd = zonedToMs(addDays(day, 2), '00:00') - SLOT_MS
  if (end <= start || end > latestEnd) end = Math.min(start + DEFAULT_LENGTH_MS, latestEnd)

  return { start, end, day }
}

/** The window as search params; the first bookable day is left out of the URL */
export function toSearch({ start, end, day }: BookingWindow, now: number): WindowSearch {
  return {
    date: day === dayOptions(now)[0] ? undefined : day,
    from: zonedClock(start),
    to: zonedClock(end),
    toNextDay: zonedDayKey(end) !== day,
  }
}

/** Start options: every slot of the day still ahead */
export function startOptions(day: string, now: number) {
  const first = Math.max(nextSlotStart(now), zonedToMs(day, '00:00'))
  const options: number[] = []
  for (let t = first; zonedDayKey(t) === day; t += SLOT_MS) options.push(t)
  return options
}

/** End options: every slot boundary after `start` until the end of the next day */
export function endOptions(start: number, day: string) {
  const last = zonedToMs(addDays(day, 2), '00:00') - SLOT_MS
  const options: number[] = []
  for (let t = start + SLOT_MS; t <= last; t += SLOT_MS) options.push(t)
  return options
}
