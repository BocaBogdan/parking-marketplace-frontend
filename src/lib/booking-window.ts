import { addDays, zonedClock, zonedDayKey, zonedToMs } from '@/lib/format'

/** Bookings are made of 30-minute slots aligned to :00 and :30 */
export const SLOT_MS = 30 * 60 * 1000
const DEFAULT_LENGTH_MS = 2 * 60 * 60 * 1000

/** Start of the next bookable slot (Bucharest is a whole-hour offset, so UTC alignment matches) */
export function nextSlotStart(now: number) {
  return Math.ceil(now / SLOT_MS) * SLOT_MS
}

/** The window as it lives in the URL: start is always on the booking day, end on it or the next */
export interface WindowSearch {
  from?: string
  to?: string
  toNextDay?: boolean
}

export interface BookingWindow {
  start: number
  end: number
  /** The day searches start on — today, or tomorrow after 23:30 */
  day: string
}

function isClock(value: string | undefined): value is string {
  return !!value && /^([01]\d|2[0-3]):(00|30)$/.test(value)
}

/** Turns URL params into instants, falling back to sensible defaults for missing/stale values */
export function resolveWindow(search: WindowSearch, now: number): BookingWindow {
  const earliest = nextSlotStart(now)
  const day = zonedDayKey(earliest)

  let start = isClock(search.from) ? zonedToMs(day, search.from) : earliest
  if (start < earliest) start = earliest

  let end = isClock(search.to)
    ? zonedToMs(search.toNextDay ? addDays(day, 1) : day, search.to)
    : start + DEFAULT_LENGTH_MS
  const latestEnd = zonedToMs(addDays(day, 2), '00:00') - SLOT_MS
  if (end <= start || end > latestEnd) end = Math.min(start + DEFAULT_LENGTH_MS, latestEnd)

  return { start, end, day }
}

export function toSearch({ start, end, day }: BookingWindow): Required<WindowSearch> {
  return { from: zonedClock(start), to: zonedClock(end), toNextDay: zonedDayKey(end) !== day }
}

/** Start options: every remaining slot of the booking day */
export function startOptions(now: number) {
  const first = nextSlotStart(now)
  const day = zonedDayKey(first)
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
