import { useId, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BanIcon, CircleAlertIcon, Loader2Icon, ZapIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/lib/api'
import { SLOT_MS, nextSlotStart } from '@/lib/booking-window'
import { serverErrorMessage } from '@/lib/form'
import {
  addDays,
  formatDayKey,
  formatDuration,
  formatTime,
  parseApiDate,
  toZonedIso,
  zonedClock,
  zonedDayKey,
  zonedToMs,
} from '@/lib/format'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'
import { activeOverride, endOverride, spotOverridesQuery, startOverride } from '@/queries/overrides'
import { spotReservationsQuery, upcomingReservations } from '@/queries/reservations'
import type { OverrideType, Spot, SpotOverride } from '@/types/models'

const HOUR_MS = 60 * 60 * 1000
const QUICK_PICKS_MS = [1, 2, 4].map((hours) => hours * HOUR_MS)
/** The backend wants an override to last at least one slot */
const MIN_LENGTH_MS = 30 * 60 * 1000

const FIELD_CLASS =
  'h-11 w-full rounded-lg border border-transparent bg-primary-50 px-3 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30'

/** Overrides change who can book the spot, so refresh Find Spot and the statistics too */
function useInvalidateOverrides(spotId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['spots', spotId, 'overrides'] }),
      queryClient.invalidateQueries({ queryKey: ['spots', 'available'] }),
      queryClient.invalidateQueries({ queryKey: ['spots', spotId, 'stats'] }),
    ])
}

/** "Today 18:00" / "Tomorrow 09:00" / "Thu, Oct 29 18:00" */
function useUntilLabel() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  return (ms: number, now: number) => {
    const day = zonedDayKey(ms)
    const today = zonedDayKey(now)
    const dayLabel =
      day === today
        ? t('find.today')
        : day === addDays(today, 1)
          ? t('find.tomorrow')
          : formatDayKey(day, language, { weekday: 'short', month: 'short', day: 'numeric' })
    return `${dayLabel} ${formatTime(ms, language)}`
  }
}

/**
 * "Free now" and "Busy now" for one spot: temporary overrides of its weekly schedule. While
 * one is active the card shows it in a banner instead, with a way to end it early.
 */
export function OverrideControls({ spot }: { spot: Spot }) {
  const now = useNow()
  const { data: overrides = [] } = useQuery(spotOverridesQuery(spot.id))
  const active = activeOverride(overrides, now)

  if (active) return <ActiveOverrideBanner spot={spot} override={active} now={now} />

  return (
    <div className="grid grid-cols-2 gap-2">
      <OverrideButton spot={spot} type="FREE" />
      <OverrideButton spot={spot} type="BUSY" />
    </div>
  )
}

function OverrideButton({ spot, type }: { spot: Spot; type: OverrideType }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const isFree = type === 'FREE'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        className={cn(
          'h-11',
          isFree
            ? 'bg-secondary-50 text-secondary-800 hover:bg-secondary-100 hover:text-secondary-800 dark:bg-secondary-950 dark:text-secondary-300'
            : 'bg-tertiary-50 text-tertiary-800 hover:bg-tertiary-100 hover:text-tertiary-800 dark:bg-tertiary-950 dark:text-tertiary-300',
        )}
        onClick={() => setOpen(true)}
      >
        {isFree ? <ZapIcon /> : <BanIcon />}
        {isFree ? t('spots.override.freeNow') : t('spots.override.busyNow')}
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isFree
              ? t('spots.override.freeTitle', { number: spot.number })
              : t('spots.override.busyTitle', { number: spot.number })}
          </DialogTitle>
          <DialogDescription>
            {isFree ? t('spots.override.freeDescription') : t('spots.override.busyDescription')}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so reopening starts from fresh times */}
        {open &&
          (isFree ? (
            <OverrideForm spot={spot} type="FREE" onDone={() => setOpen(false)} />
          ) : (
            <BusyForm spot={spot} onDone={() => setOpen(false)} />
          ))}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Busy can't overlap a reservation: while one is under way it can't start at all, and
 * before the next one it must end by that reservation's start
 */
function BusyForm({ spot, onDone }: { spot: Spot; onDone: () => void }) {
  const { t } = useTranslation()
  const now = useNow()
  const untilLabel = useUntilLabel()
  const { data: reservations, isPending } = useQuery(spotReservationsQuery(spot.id))

  if (isPending) {
    return (
      <div className="flex justify-center py-6">
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const next = upcomingReservations(reservations ?? [], now)[0]
  if (next && next.start <= now) {
    return (
      <Notice>
        {t('spots.override.busyBlocked', {
          number: spot.number,
          time: untilLabel(next.end, now),
        })}
      </Notice>
    )
  }

  return <OverrideForm spot={spot} type="BUSY" limit={next?.start} onDone={onDone} />
}

interface OverrideFormProps {
  spot: Spot
  type: OverrideType
  /** Latest allowed end: the next reservation's start, for Busy */
  limit?: number
  onDone: () => void
}

function OverrideForm({ spot, type, limit, onDone }: OverrideFormProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const now = useNow()
  const untilLabel = useUntilLabel()
  const start = useStartOverride(spot, onDone)
  const dateId = useId()
  const timeId = useId()
  const durationName = useId()
  const isFree = type === 'FREE'

  const earliest = nextSlotStart(now + MIN_LENGTH_MS)
  const today = zonedDayKey(now)
  const allowed = (ms: number) => ms >= earliest && (limit === undefined || ms <= limit)

  const quickPicks = [
    ...QUICK_PICKS_MS.map((ms) => ({
      value: nextSlotStart(now + ms),
      label: formatDuration(ms, language),
    })),
    { value: zonedToMs(addDays(today, 1), '00:00'), label: t('spots.override.endOfDay') },
  ]
    .filter((pick) => allowed(pick.value))
    // Near midnight "End of day" comes before "1 h"
    .sort((a, b) => a.value - b.value)

  // Until I turn it off is impossible with a reservation ahead
  const [indefinite, setIndefinite] = useState(limit === undefined)
  const firstEnd = quickPicks[1]?.value ?? quickPicks[0]?.value ?? earliest
  const [day, setDay] = useState(zonedDayKey(firstEnd))
  const [clock, setClock] = useState(zonedClock(firstEnd))

  const times = endTimes(day, allowed)
  const until = times.find((time) => time.clock === clock)?.ms
  const maxDay = limit === undefined ? undefined : zonedDayKey(limit)

  const pick = (ms: number) => {
    setDay(zonedDayKey(ms))
    setClock(zonedClock(ms))
  }
  const changeDay = (next: string) => {
    if (!next) return
    setDay(next)
    // Keep the time if that day still offers it, else take the first one it does
    const options = endTimes(next, allowed)
    if (!options.some((time) => time.clock === clock) && options[0]) setClock(options[0].clock)
  }

  const canSubmit = !start.isPending && (indefinite || until !== undefined)
  const confirmLabel = indefinite
    ? isFree
      ? t('spots.override.confirmFreeOpen')
      : t('spots.override.confirmBusyOpen')
    : until === undefined
      ? isFree
        ? t('spots.override.freeNow')
        : t('spots.override.busyNow')
      : isFree
        ? t('spots.override.confirmFree', { time: untilLabel(until, now) })
        : t('spots.override.confirmBusy', { time: untilLabel(until, now) })

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (canSubmit) start.mutate({ type, endsAt: indefinite ? undefined : until })
      }}
    >
      {limit !== undefined && (
        <Notice>
          {t('spots.override.busyUntilReservation', { time: untilLabel(limit, now) })}
        </Notice>
      )}

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">{t('spots.override.howLong')}</legend>
        <DurationOption
          name={durationName}
          checked={indefinite}
          disabled={limit !== undefined}
          onSelect={() => setIndefinite(true)}
          title={t('spots.override.indefinite')}
          hint={t('spots.override.indefiniteHint')}
        />
        <DurationOption
          name={durationName}
          checked={!indefinite}
          onSelect={() => setIndefinite(false)}
          title={t('spots.override.specific')}
          hint={t('spots.override.specificHint')}
        />
      </fieldset>

      {!indefinite && (
        <div className="grid gap-3">
          {quickPicks.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quickPicks.map((quick) => (
                <Button
                  key={quick.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  aria-pressed={until === quick.value}
                  className={cn(
                    'rounded-full',
                    until === quick.value &&
                      'border-primary bg-primary-50 text-primary dark:bg-primary-950',
                  )}
                  onClick={() => pick(quick.value)}
                >
                  {quick.label}
                </Button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor={dateId} className="font-medium">
                {t('spots.override.date')}
              </Label>
              <input
                id={dateId}
                type="date"
                required
                value={day}
                min={zonedDayKey(earliest)}
                max={maxDay}
                onChange={(e) => changeDay(e.target.value)}
                className={FIELD_CLASS}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={timeId} className="font-medium">
                {t('spots.override.time')}
              </Label>
              <select
                id={timeId}
                value={until === undefined ? '' : clock}
                disabled={times.length === 0}
                onChange={(e) => setClock(e.target.value)}
                className={FIELD_CLASS}
              >
                {until === undefined && <option value="">—</option>}
                {times.map((time) => (
                  <option key={time.ms} value={time.clock}>
                    {formatTime(time.ms, language)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {times.length === 0 && (
            <p className="text-sm text-destructive">{t('spots.override.noTimes')}</p>
          )}
        </div>
      )}

      <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!canSubmit}>
        {start.isPending && <Loader2Icon className="animate-spin" />}
        {confirmLabel}
      </Button>
    </form>
  )
}

/** Every half hour of a Bucharest day that `allowed` accepts; skips times DST leaves out */
function endTimes(day: string, allowed: (ms: number) => boolean) {
  const times: { clock: string; ms: number }[] = []
  for (let minute = 0; minute < 24 * 60; minute += SLOT_MS / 60_000) {
    const clock = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
    const ms = zonedToMs(day, clock)
    if (zonedClock(ms) === clock && allowed(ms)) times.push({ clock, ms })
  }
  return times
}

interface DurationOptionProps {
  name: string
  checked: boolean
  disabled?: boolean
  onSelect: () => void
  title: string
  hint: string
}

function DurationOption({ name, checked, disabled, onSelect, title, hint }: DurationOptionProps) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
        checked ? 'border-primary bg-primary-50 dark:bg-primary-950' : 'hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="mt-0.5 size-4 accent-primary"
      />
      <span className="grid gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-sm text-muted-foreground">{hint}</span>
      </span>
    </label>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-tertiary-50 px-3 py-2.5 text-sm dark:bg-tertiary-950/40">
      <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-tertiary-700 dark:text-tertiary-300" />
      <span>{children}</span>
    </p>
  )
}

function useStartOverride(spot: Spot, onDone: () => void) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const invalidate = useInvalidateOverrides(spot.id)
  const untilLabel = useUntilLabel()

  return useMutation({
    mutationFn: (body: { type: OverrideType; endsAt?: number }) =>
      startOverride(spot.id, {
        type: body.type,
        endsAt: body.endsAt === undefined ? undefined : toZonedIso(body.endsAt),
      }),
    onSuccess: async (_, { type, endsAt }) => {
      await invalidate()
      const values = {
        number: spot.number,
        time: endsAt === undefined ? '' : untilLabel(endsAt, Date.now()),
      }
      toast.success(
        type === 'FREE'
          ? endsAt === undefined
            ? t('spots.override.toast.freeOpen', values)
            : t('spots.override.toast.free', values)
          : endsAt === undefined
            ? t('spots.override.toast.busyOpen', values)
            : t('spots.override.toast.busy', values),
      )
      onDone()
    },
    onError: async (error) => {
      // Someone reserved the spot meanwhile: reload its reservations so the form adapts
      if (error instanceof ApiError && error.status === 409) {
        await queryClient.invalidateQueries({ queryKey: ['spots', spot.id, 'reservations'] })
        toast.error(t('spots.override.toast.conflict'))
        return
      }
      toast.error(serverErrorMessage(error))
    },
  })
}

interface ActiveOverrideBannerProps {
  spot: Spot
  override: SpotOverride
  now: number
}

function ActiveOverrideBanner({ spot, override, now }: ActiveOverrideBannerProps) {
  const { t } = useTranslation()
  const untilLabel = useUntilLabel()
  const invalidate = useInvalidateOverrides(spot.id)
  const isFree = override.type === 'FREE'
  const time = override.endsAt ? untilLabel(parseApiDate(override.endsAt), now) : undefined

  const end = useMutation({
    mutationFn: () => endOverride(spot.id, override.id),
    onSuccess: async () => {
      await invalidate()
      toast.success(t('spots.override.toast.ended'))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  return (
    <div
      role="status"
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2.5',
        isFree
          ? 'border-secondary-200 bg-secondary-50 text-secondary-800 dark:border-secondary-900 dark:bg-secondary-950 dark:text-secondary-200'
          : 'border-tertiary-200 bg-tertiary-50 text-tertiary-800 dark:border-tertiary-900 dark:bg-tertiary-950 dark:text-tertiary-200',
      )}
    >
      {isFree ? <ZapIcon className="size-4 shrink-0" /> : <BanIcon className="size-4 shrink-0" />}
      <p className="min-w-0 flex-1 text-sm font-semibold">
        {isFree
          ? time
            ? t('spots.override.bannerFree', { time })
            : t('spots.override.bannerFreeOpen')
          : time
            ? t('spots.override.bannerBusy', { time })
            : t('spots.override.bannerBusyOpen')}
      </p>
      <Button
        size="sm"
        variant="outline"
        className="bg-background"
        disabled={end.isPending}
        onClick={() => end.mutate()}
      >
        {end.isPending && <Loader2Icon className="animate-spin" />}
        {t('spots.override.end')}
      </Button>
    </div>
  )
}
