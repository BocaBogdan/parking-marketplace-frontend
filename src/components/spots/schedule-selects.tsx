import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { DAYS, displayTime, weekdayName, type DayOfWeek } from '@/lib/schedule'

interface NumberSelectProps<T extends number> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  error?: string
}

/** Native select: the best picker on phones, and plenty for a short fixed list */
function NumberSelect<T extends number>({
  label,
  value,
  options,
  onChange,
  error,
}: NumberSelectProps<T>) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="font-medium">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as T)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-11 w-full rounded-lg border border-transparent bg-primary-50 px-3 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

interface TimeSelectProps {
  label: string
  /** Minutes since midnight */
  value: number
  options: number[]
  onChange: (value: number) => void
  error?: string
}

export function TimeSelect({ options, ...props }: TimeSelectProps) {
  return (
    <NumberSelect
      {...props}
      options={options.map((minutes) => ({ value: minutes, label: displayTime(minutes) }))}
    />
  )
}

interface DaySelectProps {
  label: string
  value: DayOfWeek
  onChange: (value: DayOfWeek) => void
  error?: string
}

export function DaySelect(props: DaySelectProps) {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  return (
    <NumberSelect
      {...props}
      options={DAYS.map((day) => ({ value: day, label: weekdayName(day, language, 'long') }))}
    />
  )
}
