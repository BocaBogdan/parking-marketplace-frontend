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
  const monthDay = new Intl.DateTimeFormat(language, {
    timeZone: TIME_ZONE,
    month: 'short',
    day: 'numeric',
  }).format(date)
  if (days !== 0 && days !== 1) return monthDay

  const relative = new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(days, 'day')
  return `${relative.charAt(0).toLocaleUpperCase(language)}${relative.slice(1)}, ${monthDay}`
}

export function formatTime(value: string | Date, language: string) {
  return new Intl.DateTimeFormat(language, {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
