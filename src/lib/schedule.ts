import type { components } from '@/types/api'

export type DayOfWeek = components['schemas']['DayOfWeek']
type Schedule = components['schemas']['ScheduleRead']

export const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export const DAY_PRESETS = {
  weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  weekend: ['SAT', 'SUN'],
  everyDay: DAYS,
} satisfies Record<string, DayOfWeek[]>

/**
 * "Until midnight". The backend has no 24:00 and checks that one schedule fully covers
 * a booking, where the end of a day is time.max — so a day-long schedule must end there.
 */
export const END_OF_DAY = '23:59:59.999999'

/** Every 30-minute boundary as "HH:MM:SS" — bookings are 30-minute slots */
const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const minutes = i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 ? '30' : '00'}:00`
})
export const START_TIMES = HALF_HOURS
export const END_TIMES = [...HALF_HOURS.slice(1), END_OF_DAY]

/** "09:00:00" → "09:00", end of day → "24:00" */
export function displayTime(time: string) {
  return time === END_OF_DAY || time.startsWith('23:59:59') ? '24:00' : time.slice(0, 5)
}

// 2024-01-01 was a Monday
function weekdayDate(day: DayOfWeek) {
  return new Date(Date.UTC(2024, 0, 1 + DAYS.indexOf(day)))
}

export function weekdayName(day: DayOfWeek, language: string, width: 'short' | 'long') {
  return new Intl.DateTimeFormat(language, { weekday: width, timeZone: 'UTC' }).format(
    weekdayDate(day),
  )
}

/** "Mon – Fri", "Sat, Sun", "Mon, Wed – Fri": runs of 3+ consecutive days are collapsed */
export function formatDays(days: DayOfWeek[], language: string) {
  const sorted = [...new Set(days)].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b))
  const runs: DayOfWeek[][] = []
  for (const day of sorted) {
    const run = runs.at(-1)
    if (run && DAYS.indexOf(day) === DAYS.indexOf(run.at(-1)!) + 1) run.push(day)
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
  start_time: string
  end_time: string
  days: DayOfWeek[]
  /** One backend row per day */
  ids: string[]
}

/** The backend stores one row per day; group rows with the same hours for display */
export function groupSchedules(schedules: Schedule[]): ScheduleGroup[] {
  const groups = new Map<string, ScheduleGroup>()
  for (const schedule of schedules) {
    const key = `${schedule.start_time}-${schedule.end_time}`
    const group = groups.get(key) ?? {
      key,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      days: [],
      ids: [],
    }
    group.days.push(schedule.day_of_week)
    group.ids.push(schedule.id)
    groups.set(key, group)
  }
  return [...groups.values()].sort(
    (a, b) =>
      DAYS.indexOf(a.days[0]) - DAYS.indexOf(b.days[0]) || a.start_time.localeCompare(b.start_time),
  )
}

/** True if [start, end) overlaps any existing schedule on one of `days` */
export function overlapsExisting(
  schedules: Schedule[],
  days: DayOfWeek[],
  start: string,
  end: string,
) {
  return schedules.some(
    (s) => days.includes(s.day_of_week) && s.start_time < end && s.end_time > start,
  )
}
