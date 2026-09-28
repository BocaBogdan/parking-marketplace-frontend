// Per the backend grooming doc, everything happens in Bucharest local time
const TIME_ZONE = 'Europe/Bucharest'

/**
 * Instant of a backend timestamp. The API stores and returns UTC *without* an offset
 * ("2026-09-28T12:30:00"), and JS would read that as browser-local time — hours off.
 * Timestamps that do carry an offset or `Z` are respected as-is.
 */
export function parseApiDate(value: string | number | Date): number {
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(value)
  return Date.parse(hasZone ? value : `${value}Z`)
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)
}

/** "Tomorrow, Sep 26" / "Mâine, 26 sept." — relative word for yesterday/today/tomorrow, else "Mon, Sep 21" */
export function formatDay(value: string | number | Date, language: string, now: number) {
  const date = new Date(parseApiDate(value))
  const days = Math.round(
    (Date.parse(dayKey(date)) - Date.parse(dayKey(new Date(now)))) / (24 * 60 * 60 * 1000),
  )
  const monthDay = formatDate(date, language)
  if (Math.abs(days) > 1) {
    return new Intl.DateTimeFormat(language, {
      timeZone: TIME_ZONE,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const relative = new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(days, 'day')
  return `${relative.charAt(0).toLocaleUpperCase(language)}${relative.slice(1)}, ${monthDay}`
}

/** "Sep 25" / "25 sept." */
export function formatDate(value: string | number | Date, language: string) {
  return new Intl.DateTimeFormat(language, {
    timeZone: TIME_ZONE,
    month: 'short',
    day: 'numeric',
  }).format(parseApiDate(value))
}

export function formatTime(value: string | number | Date, language: string) {
  return new Intl.DateTimeFormat(language, {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parseApiDate(value))
}

const pad = (n: number) => String(n).padStart(2, '0')

function zonedParts(ms: number) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(new Date(ms))
      .map((part) => [part.type, part.value]),
  ) as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', string>
}

/** Bucharest UTC offset in minutes at an instant (+180 in summer, +120 in winter) */
function offsetMinutes(ms: number) {
  const p = zonedParts(ms)
  const wall = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`)
  return Math.round((wall - Math.floor(ms / 1000) * 1000) / 60_000)
}

/**
 * ISO timestamp with the Bucharest offset ("2026-09-28T09:00:00+03:00"). The backend
 * compares the wall-clock time of the values it receives against schedule times, so
 * windows must be sent in local time — `toISOString()` (UTC) would shift them by 2–3 h.
 */
export function toZonedIso(ms: number) {
  const p = zonedParts(ms)
  const offset = offsetMinutes(ms)
  const sign = offset >= 0 ? '+' : '-'
  const abs = Math.abs(offset)
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/** Bucharest calendar day of an instant, "2026-09-28" */
export function zonedDayKey(ms: number) {
  const p = zonedParts(ms)
  return `${p.year}-${p.month}-${p.day}`
}

/** Bucharest wall-clock time of an instant, "19:00" */
export function zonedClock(ms: number) {
  const p = zonedParts(ms)
  return `${p.hour}:${p.minute}`
}

/** The instant a Bucharest wall-clock time happens on a given day */
export function zonedToMs(dayKey: string, clock: string) {
  const asUtc = Date.parse(`${dayKey}T${clock}:00Z`)
  // Correct twice so a guess on the other side of a DST switch still lands right
  const first = asUtc - offsetMinutes(asUtc) * 60_000
  return asUtc - offsetMinutes(first) * 60_000
}

export function addDays(dayKey: string, days: number) {
  const date = new Date(`${dayKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** "3 h 30 min" / "17h" */
export function formatDuration(ms: number, language: string) {
  const totalMinutes = Math.round(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const unit = (value: number, u: 'hour' | 'minute') =>
    new Intl.NumberFormat(language, { style: 'unit', unit: u, unitDisplay: 'short' }).format(value)
  return [hours && unit(hours, 'hour'), minutes && unit(minutes, 'minute')]
    .filter(Boolean)
    .join(' ')
}
