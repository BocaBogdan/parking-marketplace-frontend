import { useState } from 'react'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { CalendarClockIcon, Loader2Icon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { columnHelper } from '@/components/data-table/features'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { firstErrorMessage } from '@/components/form/field-error'
import { FormError } from '@/components/form/form-error'
import { DaySelect, TimeSelect } from '@/components/spots/schedule-selects'
import { serverErrorMessage, setServerErrors, useAppForm } from '@/lib/form'
import {
  DAYS,
  dayOrder,
  displayTime,
  END_TIMES,
  hoursSortValue,
  overlapsExisting,
  sortSchedules,
  START_TIMES,
  weekdayName,
  type DayOfWeek,
} from '@/lib/schedule'
import { deleteSchedule, spotSchedulesQuery, updateSchedule } from '@/queries/schedules'
import type { Schedule, Spot } from '@/types/models'

/** Every change to a spot's hours also changes what Find Spot can offer */
function useInvalidateSchedules(spotId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['spots', spotId, 'schedules'] }),
      queryClient.invalidateQueries({ queryKey: ['spots', 'available'] }),
    ])
}

const col = columnHelper<Schedule>()

/** A spot's weekly hours, one row per day, each editable and removable */
export function ScheduleTable({ spot }: { spot: Spot }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const { data } = useSuspenseQuery(spotSchedulesQuery(spot.id))
  const schedules = sortSchedules(data)
  const [editing, setEditing] = useState<Schedule>()

  if (schedules.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
        <CalendarClockIcon className="size-4 shrink-0" />
        {t('availability.empty')}
      </p>
    )
  }

  const columns = col.columns([
    col.accessor((schedule) => dayOrder(schedule.dayOfWeek as DayOfWeek), {
      id: 'day',
      header: t('availability.columns.day'),
      meta: { rowHeader: true, cellClassName: 'py-1.5 font-semibold capitalize' },
      cell: ({ row }) => weekdayName(row.original.dayOfWeek as DayOfWeek, language, 'long'),
    }),
    col.accessor(hoursSortValue, {
      id: 'hours',
      header: t('availability.columns.hours'),
      meta: { cellClassName: 'py-1.5 whitespace-nowrap text-muted-foreground tabular-nums' },
      cell: ({ row }) =>
        `${displayTime(row.original.startMinute)} – ${displayTime(row.original.endMinute)}`,
    }),
    col.display({
      id: 'actions',
      header: t('availability.columns.actions'),
      meta: { srOnlyHeader: true, cellClassName: 'px-1 py-1.5' },
      cell: ({ row }) => (
        <ScheduleActions
          spotId={spot.id}
          schedule={row.original}
          onEdit={() => setEditing(row.original)}
        />
      ),
    }),
  ])

  return (
    <>
      <DataTable
        data={schedules}
        columns={columns}
        getRowId={(schedule) => schedule.id}
        variant="compact"
        caption={t('availability.weekly')}
      />
      <EditScheduleDialog
        spotId={spot.id}
        schedule={editing}
        others={schedules.filter((s) => s.id !== editing?.id)}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </>
  )
}

interface ScheduleActionsProps {
  spotId: string
  schedule: Schedule
  onEdit: () => void
}

/** Edit and remove for one row */
function ScheduleActions({ spotId, schedule, onEdit }: ScheduleActionsProps) {
  const { t, i18n } = useTranslation()
  const invalidate = useInvalidateSchedules(spotId)
  const day = weekdayName(schedule.dayOfWeek as DayOfWeek, i18n.resolvedLanguage ?? 'en', 'long')
  const from = displayTime(schedule.startMinute)
  const to = displayTime(schedule.endMinute)

  const remove = useMutation({
    mutationFn: () => deleteSchedule(spotId, schedule.id),
    onSuccess: () => toast.success(t('availability.removed')),
    onError: (error) => toast.error(serverErrorMessage(error)),
    onSettled: invalidate,
  })

  return (
    <div className="flex justify-end">
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        aria-label={t('availability.edit', { day, from, to })}
        onClick={onEdit}
      >
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        aria-label={t('availability.remove', { days: day, from, to })}
        disabled={remove.isPending}
        onClick={() => remove.mutate()}
      >
        {remove.isPending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
      </Button>
    </div>
  )
}

interface EditScheduleDialogProps {
  spotId: string
  /** The row being edited; undefined closes the dialog */
  schedule: Schedule | undefined
  /** The spot's other rows, which the new hours mustn't overlap */
  others: Schedule[]
  onOpenChange: (open: boolean) => void
}

function EditScheduleDialog({ spotId, schedule, others, onOpenChange }: EditScheduleDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={schedule !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{t('availability.editTitle')}</DialogTitle>
          <DialogDescription>{t('availability.editDescription')}</DialogDescription>
        </DialogHeader>
        {schedule && (
          <EditScheduleForm
            key={schedule.id}
            spotId={spotId}
            schedule={schedule}
            others={others}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

const editScheduleSchema = z
  .object({
    dayOfWeek: z.literal(DAYS),
    startMinute: z.number(),
    endMinute: z.number(),
  })
  .refine((v) => v.endMinute > v.startMinute, {
    message: 'validation.endAfterStart',
    path: ['endMinute'],
  })

type EditScheduleValues = z.infer<typeof editScheduleSchema>

interface EditScheduleFormProps {
  spotId: string
  schedule: Schedule
  others: Schedule[]
  onDone: () => void
}

function EditScheduleForm({ spotId, schedule, others, onDone }: EditScheduleFormProps) {
  const { t } = useTranslation()
  const invalidate = useInvalidateSchedules(spotId)

  const save = useMutation({
    mutationFn: (values: EditScheduleValues) => updateSchedule(spotId, schedule.id, values),
    onSuccess: async () => {
      await invalidate()
      toast.success(t('availability.updated'))
      onDone()
    },
  })

  // Same rule as adding hours: a booking must fit inside one schedule, so overlapping
  // rows on the same day add nothing
  const schema = editScheduleSchema.refine(
    (v) => !overlapsExisting(others, [v.dayOfWeek], v.startMinute, v.endMinute),
    { message: 'validation.scheduleOverlap', path: ['endMinute'] },
  )

  const defaultValues: EditScheduleValues = {
    dayOfWeek: schedule.dayOfWeek as DayOfWeek,
    startMinute: schedule.startMinute,
    endMinute: schedule.endMinute,
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: schema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await save.mutateAsync(value)
      } catch (error) {
        setServerErrors(formApi, error)
      }
    },
  })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="grid gap-4"
    >
      <form.AppForm>
        <FormError />
      </form.AppForm>
      <form.Field name="dayOfWeek">
        {(field) => (
          <DaySelect
            label={t('availability.day')}
            value={field.state.value}
            onChange={field.handleChange}
          />
        )}
      </form.Field>
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="startMinute">
          {(field) => (
            <TimeSelect
              label={t('availability.from')}
              value={field.state.value}
              options={START_TIMES}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field name="endMinute">
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
        <form.SubmitButton>{t('availability.save')}</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}
