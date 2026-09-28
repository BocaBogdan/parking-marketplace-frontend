// Per the backend grooming doc, everything happens in Bucharest local time
const TIME_ZONE = 'Europe/Bucharest'

function dayKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)
}

/** "Tomorrow, Sep 26" / "Mâine, 26 sept." — relative word only for today and tomorrow */
export function formatDay(value: string | Date, language: string, now: number) {
  const date = new Date(value)
  const days = Math.round(
    (Date.parse(dayKey(date)) - Date.parse(dayKey(new Date(now)))) / (24 * 60 * 60 * 1000),
  )
  const monthDay = formatDate(date, language)
  if (days !== 0 && days !== 1) return monthDay

  const relative = new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(days, 'day')
  return `${relative.charAt(0).toLocaleUpperCase(language)}${relative.slice(1)}, ${monthDay}`
}

/** "Sep 25" / "25 sept." */
export function formatDate(value: string | Date, language: string) {
  return new Intl.DateTimeFormat(language, {
    timeZone: TIME_ZONE,
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function formatTime(value: string | Date, language: string) {
  return new Intl.DateTimeFormat(language, {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * ISO timestamp with the Bucharest offset ("2026-09-28T09:00:00+03:00"). The backend
 * compares the wall-clock time of the values it receives against schedule times, so
 * windows must be sent in local time — `toISOString()` (UTC) would shift them by 2–3 h.
 */
export function toZonedIso(ms: number) {
  const parts = Object.fromEntries(
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
  )
  const local = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
  const offset = Math.round((Date.parse(`${local}Z`) - ms) / 60_000)
  const sign = offset >= 0 ? '+' : '-'
  return `${local}${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
}
