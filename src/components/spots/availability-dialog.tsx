import { useId } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useStore } from '@tanstack/react-form'
import { CalendarClockIcon, Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { firstErrorMessage } from '@/components/form/field-error'
import { FormError } from '@/components/form/form-error'
import { serverErrorMessage, setServerErrors, useAppForm } from '@/lib/form'
import {
  DAY_PRESETS,
  DAYS,
  displayTime,
  END_TIMES,
  formatDays,
  groupSchedules,
  overlapsExisting,
  START_TIMES,
  weekdayName,
  type DayOfWeek,
  type ScheduleGroup,
} from '@/lib/schedule'
import { cn } from '@/lib/utils'
import { createSchedules, deleteSchedule, spotSchedulesQuery } from '@/queries/schedules'
import type { components } from '@/types/api'

type Spot = components['schemas']['SpotRead']
type Schedule = components['schemas']['ScheduleRead']

interface AvailabilityDialogProps {
  spot: Spot | undefined
  onOpenChange: (open: boolean) => void
}

export function AvailabilityDialog({ spot, onOpenChange }: AvailabilityDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={spot !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        {spot && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {t('availability.title', { number: spot.spot_number })}
              </DialogTitle>
              <DialogDescription>{t('availability.description')}</DialogDescription>
            </DialogHeader>
            <AvailabilityEditor spotId={spot.id} />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AvailabilityEditor({ spotId }: { spotId: string }) {
  const { data: schedules, isPending } = useQuery(spotSchedulesQuery(spotId))

  if (isPending || !schedules) {
    return (
      <div className="flex justify-center py-10">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <WeeklySchedule spotId={spotId} schedules={schedules} />
      <AddHoursForm spotId={spotId} schedules={schedules} />
    </div>
  )
}

function WeeklySchedule({ spotId, schedules }: { spotId: string; schedules: Schedule[] }) {
  const { t } = useTranslation()
  const groups = groupSchedules(schedules)

  return (
    <section className="grid gap-2">
      <h3 className="text-sm font-semibold">{t('availability.weekly')}</h3>
      {groups.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
          <CalendarClockIcon className="size-4 shrink-0" />
          {t('availability.empty')}
        </p>
      ) : (
        <ul className="grid gap-2">
          {groups.map((group) => (
            <ScheduleRow key={group.key} spotId={spotId} group={group} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ScheduleRow({ spotId, group }: { spotId: string; group: ScheduleGroup }) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const days = formatDays(group.days, i18n.resolvedLanguage ?? 'en')
  const from = displayTime(group.start_time)
  const to = displayTime(group.end_time)

  // The backend stores one row per day, so removing a group deletes each of them
  const remove = useMutation({
    mutationFn: () => Promise.all(group.ids.map((id) => deleteSchedule(spotId, id))),
    onSuccess: () => toast.success(t('availability.removed')),
    onError: (error) => toast.error(serverErrorMessage(error)),
    // Refetch either way: a partial failure may still have removed some days
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['spots', spotId, 'schedules'] }),
  })

  return (
    <li className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
      <div className="grid flex-1">
        <span className="font-semibold">{days}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          {from} – {to}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-lg"
        className="text-muted-foreground hover:text-destructive"
        aria-label={t('availability.remove', { days, from, to })}
        disabled={remove.isPending}
        onClick={() => remove.mutate()}
      >
        {remove.isPending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
      </Button>
    </li>
  )
}

const scheduleFormSchema = z
  .object({
    days_of_week: z.array(z.enum(DAYS)).min(1, 'validation.daysRequired'),
    start_time: z.string(),
    end_time: z.string(),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: 'validation.endAfterStart',
    path: ['end_time'],
  })

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

// The example most owners start from: weekdays, office hours
const defaultValues: ScheduleFormValues = {
  days_of_week: DAY_PRESETS.weekdays,
  start_time: '09:00:00',
  end_time: '17:00:00',
}

function AddHoursForm({ spotId, schedules }: { spotId: string; schedules: Schedule[] }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const queryClient = useQueryClient()

  const add = useMutation({
    mutationFn: (values: ScheduleFormValues) => createSchedules(spotId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['spots', spotId, 'schedules'] })
      toast.success(t('availability.added'))
    },
  })

  // Overlapping hours on the same day don't add availability — the backend needs one
  // schedule to cover a whole booking — so catch them before they're saved
  const schema = scheduleFormSchema.refine(
    (v) => !overlapsExisting(schedules, v.days_of_week, v.start_time, v.end_time),
    { message: 'validation.scheduleOverlap', path: ['days_of_week'] },
  )

  const form = useAppForm({
    defaultValues,
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await add.mutateAsync(value)
        formApi.reset()
      } catch (error) {
        setServerErrors(formApi, error)
      }
    },
  })
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts)

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="grid gap-4 rounded-xl border p-4"
    >
      <h3 className="text-sm font-semibold">{t('availability.add')}</h3>
      <form.AppForm>
        <FormError />
      </form.AppForm>

      <form.Field name="days_of_week">
        {(field) => {
          const selected = field.state.value
          const toggle = (day: DayOfWeek) =>
            field.handleChange(
              selected.includes(day) ? selected.filter((d) => d !== day) : [...selected, day],
            )
          const error =
            submissionAttempts > 0 || field.state.meta.isDirty
              ? firstErrorMessage(field.state.meta.errors)
              : undefined

          return (
            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">{t('availability.days')}</legend>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(DAY_PRESETS).map(([preset, days]) => (
                  <Button
                    key={preset}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => field.handleChange(days)}
                  >
                    {t(`availability.presets.${preset as keyof typeof DAY_PRESETS}`)}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((day) => {
                  const isOn = selected.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={isOn}
                      aria-label={weekdayName(day, language, 'long')}
                      onClick={() => toggle(day)}
                      className={cn(
                        'h-10 rounded-lg text-xs font-semibold capitalize transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                        isOn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary-50 text-muted-foreground hover:text-foreground dark:bg-input/30',
                      )}
                    >
                      {weekdayName(day, language, 'short').replace('.', '')}
                    </button>
                  )
                })}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </fieldset>
          )
        }}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="start_time">
          {(field) => (
            <TimeSelect
              label={t('availability.from')}
              value={field.state.value}
              options={START_TIMES}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="end_time">
          {(field) => (
            <TimeSelect
              label={t('availability.to')}
              value={field.state.value}
              options={END_TIMES}
              onChange={field.handleChange}
              error={firstErrorMessage(field.state.meta.errors)}
            />
          )}
        </form.Field>
      </div>

      <form.AppForm>
        <form.SubmitButton>
          <PlusIcon />
          {t('availability.add')}
        </form.SubmitButton>
      </form.AppForm>
    </form>
  )
}

interface TimeSelectProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  error?: string
}

function TimeSelect({ label, value, options, onChange, error }: TimeSelectProps) {
  const id = useId()
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="font-medium">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-11 w-full rounded-lg border border-transparent bg-primary-50 px-3 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30"
      >
        {options.map((time) => (
          <option key={time} value={time}>
            {displayTime(time)}
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
