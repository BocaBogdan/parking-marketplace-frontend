import type { Schedule } from '@/types/models'

/** 0 = Sunday … 6 = Saturday, like `Date.getDay()` */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Display order: the week starts on Monday in Romania */
export const DAYS = [1, 2, 3, 4, 5, 6, 0] as const satisfies readonly DayOfWeek[]

export const DAY_PRESETS = {
  weekdays: [1, 2, 3, 4, 5],
  weekend: [6, 0],
  everyDay: [...DAYS],
} satisfies Record<string, DayOfWeek[]>

/** Schedules are minutes since midnight; a day-long one ends at 1440 ("24:00") */
export const MINUTES_PER_DAY = 24 * 60

/** Every 30-minute boundary — bookings are 30-minute slots */
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => i * 30)
export const START_TIMES = HALF_HOURS
export const END_TIMES = [...HALF_HOURS.slice(1), MINUTES_PER_DAY]

/** 540 → "09:00", 1440 → "24:00" */
export function displayTime(minutes: number) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
}

// 2024-01-07 was a Sunday
function weekdayDate(day: DayOfWeek) {
  return new Date(Date.UTC(2024, 0, 7 + day))
}

export function weekdayName(day: DayOfWeek, language: string, width: 'short' | 'long') {
  return new Intl.DateTimeFormat(language, { weekday: width, timeZone: 'UTC' }).format(
    weekdayDate(day),
  )
}

const dayOrder = (day: DayOfWeek) => DAYS.indexOf(day)

/** "Mon – Fri", "Sat, Sun", "Mon, Wed – Fri": runs of 3+ consecutive days are collapsed */
export function formatDays(days: DayOfWeek[], language: string) {
  const sorted = [...new Set(days)].sort((a, b) => dayOrder(a) - dayOrder(b))
  const runs: DayOfWeek[][] = []
  for (const day of sorted) {
    const run = runs.at(-1)
    if (run && dayOrder(day) === dayOrder(run.at(-1)!) + 1) run.push(day)
    else runs.push([day])
  }
  const label = (day: DayOfWeek) => weekdayName(day, language, 'short')
  return runs
    .flatMap((run) =>
      run.length >= 3 ? [`${label(run[0])} – ${label(run.at(-1)!)}`] : run.map(label),
    )
    .join(', ')
}

export interface ScheduleGroup {
  key: string
  startMinute: number
  endMinute: number
  days: DayOfWeek[]
  /** One backend row per day */
  ids: string[]
}

/** The backend stores one row per day; group rows with the same hours for display */
export function groupSchedules(schedules: Schedule[]): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>()
  for (const schedule of schedules) {
    const key = `${schedule.startMinute}-${schedule.endMinute}`
    const group = groups.get(key) ?? {
      key,
      startMinute: schedule.startMinute,
      endMinute: schedule.endMinute,
      days: [],
      ids: [],
    }
    group.days.push(schedule.dayOfWeek as DayOfWeek)
    group.ids.push(schedule.id)
    groups.set(key, group)
  }
  for (const group of groups.values()) group.days.sort((a, b) => dayOrder(a) - dayOrder(b))
  return [...groups.values()].sort(
    (a, b) => dayOrder(a.days[0]) - dayOrder(b.days[0]) || a.startMinute - b.startMinute,
  )
}

/** One row per day, in week order (Monday first), earliest hours first */
export function sortSchedules(schedules: Schedule[]) {
  return [...schedules].sort(
    (a, b) =>
      dayOrder(a.dayOfWeek as DayOfWeek) - dayOrder(b.dayOfWeek as DayOfWeek) ||
      a.startMinute - b.startMinute,
  )
}

/** True if [start, end) overlaps any existing schedule on one of `days` */
export function overlapsExisting(
  schedules: Schedule[],
  days: DayOfWeek[],
  start: number,
  end: number,
) {
  return schedules.some(
    (s) => days.includes(s.dayOfWeek as DayOfWeek) && s.startMinute < end && s.endMinute > start,
  )
}
