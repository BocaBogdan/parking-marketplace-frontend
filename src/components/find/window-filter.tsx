import { useId } from 'react'
import { ArrowRightIcon, ClockIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { endOptions, SLOT_MS, startOptions, type BookingWindow } from '@/lib/booking-window'
import { formatDuration, formatTime, zonedDayKey } from '@/lib/format'

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

  const starts = startOptions(now)
  const ends = endOptions(window.start, window.day)
  const dayLabel = (ms: number) =>
    zonedDayKey(ms) === window.day ? t('find.today') : t('find.tomorrow')

  const changeStart = (start: number) => {
    // Keep the same length when possible, so moving the start doesn't collapse the window
    const length = window.end - window.start
    const latest = ends.at(-1) ?? start + SLOT_MS
    onChange({ ...window, start, end: Math.min(start + Math.max(length, SLOT_MS), latest) })
  }

  return (
    <section className="grid gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="grid gap-2">
          <Label htmlFor={fromId} className="font-semibold">
            {t('find.from')} · {t('find.today')}
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
        <ArrowRightIcon className="mb-3.5 hidden size-4 text-muted-foreground sm:block" />
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
            {(['today', 'tomorrow'] as const).map((group) => {
              const options = ends.filter(
                (ms) => (zonedDayKey(ms) === window.day) === (group === 'today'),
              )
              return (
                options.length > 0 && (
                  <optgroup key={group} label={t(`find.${group}`)}>
                    {options.map((ms) => (
                      <option key={ms} value={ms}>
                        {dayLabel(ms)} {formatTime(ms, language)}
                      </option>
                    ))}
                  </optgroup>
                )
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

const selectClassName =
  'h-11 w-full rounded-lg border border-transparent bg-primary-50 px-3 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30'
