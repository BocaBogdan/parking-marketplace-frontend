import { useEffect, useId, useRef } from 'react'
import { ArrowRightIcon, ClockIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import {
  dayOptions,
  endOptions,
  resolveWindow,
  SLOT_MS,
  startOptions,
  toSearch,
  type BookingWindow,
} from '@/lib/booking-window'
import {
  formatDayKey,
  formatDuration,
  formatRelativeDay,
  formatTime,
  zonedDayKey,
} from '@/lib/format'
import { cn } from '@/lib/utils'

interface WindowFilterProps {
  window: BookingWindow
  now: number
  onChange: (window: BookingWindow) => void
}

export function WindowFilter({ window, now, onChange }: WindowFilterProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const fromId = useId()
  const toId = useId()

  const starts = startOptions(window.day, now)
  const ends = endOptions(window.start, window.day)
  const dayLabel = (ms: number) => formatRelativeDay(ms, language, now)
  const endDays = [...new Set(ends.map(zonedDayKey))]

  // Keep the times when switching days; resolveWindow moves them if they're already past
  const changeDay = (day: string) =>
    onChange(resolveWindow({ ...toSearch(window, now), date: day }, now))

  const changeStart = (start: number) => {
    // Keep the same length when possible, so moving the start doesn't collapse the window
    const length = window.end - window.start
    const latest = ends.at(-1) ?? start + SLOT_MS
    onChange({ ...window, start, end: Math.min(start + Math.max(length, SLOT_MS), latest) })
  }

  return (
    <section className="grid gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
      <DayPicker days={dayOptions(now)} selected={window.day} onSelect={changeDay} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 sm:gap-3">
        <div className="grid gap-2">
          <Label htmlFor={fromId} className="font-semibold">
            {t('find.from')}
          </Label>
          <select
            id={fromId}
            value={window.start}
            onChange={(e) => changeStart(Number(e.target.value))}
            className={selectClassName}
          >
            {starts.map((ms) => (
              <option key={ms} value={ms}>
                {formatTime(ms, language)}
              </option>
            ))}
          </select>
        </div>
        <ArrowRightIcon className="mb-3.5 size-4 text-muted-foreground" />
        <div className="grid gap-2">
          <Label htmlFor={toId} className="font-semibold">
            {t('find.until')}
          </Label>
          <select
            id={toId}
            value={window.end}
            onChange={(e) => onChange({ ...window, end: Number(e.target.value) })}
            className={selectClassName}
          >
            {endDays.map((day) => {
              const options = ends.filter((ms) => zonedDayKey(ms) === day)
              const nextDay = day !== window.day
              return (
                <optgroup key={day} label={dayLabel(options[0])}>
                  {options.map((ms) => (
                    <option key={ms} value={ms}>
                      {/* The closed select shows only this text, so name the day once it changes */}
                      {formatTime(ms, language)}
                      {nextDay && ` · ${dayLabel(ms)}`}
                    </option>
                  ))}
                </optgroup>
              )
            })}
          </select>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200">
        <ClockIcon className="size-4" />
        <span className="font-semibold tabular-nums">
          {dayLabel(window.start)} {formatTime(window.start, language)} – {dayLabel(window.end)}{' '}
          {formatTime(window.end, language)}
        </span>
        <span className="text-primary-700/80 dark:text-primary-300/80">
          · {formatDuration(window.end - window.start, language)}
        </span>
      </p>
    </section>
  )
}

/** A swipeable strip of the bookable days: "Today", "Tomorrow", then weekday and date */
function DayPicker({
  days,
  selected,
  onSelect,
}: {
  days: string[]
  selected: string
  onSelect: (day: string) => void
}) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const selectedRef = useRef<HTMLButtonElement>(null)

  // A shared link can open on a day further along the strip
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selected])

  const format = (day: string, options: Intl.DateTimeFormatOptions) =>
    formatDayKey(day, language, options)

  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold">{t('find.day')}</p>
      <div className="flex snap-x gap-2 overflow-x-auto pb-2">
        {days.map((day, index) => {
          const isSelected = day === selected
          const top =
            index === 0
              ? t('find.today')
              : index === 1
                ? t('find.tomorrow')
                : format(day, { weekday: 'short' })
          return (
            <button
              key={day}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              aria-pressed={isSelected}
              aria-label={format(day, { weekday: 'long', month: 'long', day: 'numeric' })}
              onClick={() => onSelect(day)}
              className={cn(
                'flex min-w-16 shrink-0 snap-start flex-col items-center rounded-xl border px-2 py-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted',
              )}
            >
              <span
                className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-primary-foreground/85' : 'text-muted-foreground',
                )}
              >
                {top}
              </span>
              <span className="text-lg leading-tight font-bold tabular-nums">
                {format(day, { day: 'numeric' })}
              </span>
              <span
                className={cn(
                  'text-xs',
                  isSelected ? 'text-primary-foreground/85' : 'text-muted-foreground',
                )}
              >
                {format(day, { month: 'short' })}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const selectClassName =
  'h-11 w-full rounded-lg border border-transparent bg-primary-50 px-3 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30'
