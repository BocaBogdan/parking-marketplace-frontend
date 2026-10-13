import { useId, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BanIcon, Loader2Icon, ZapIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { SLOT_MS, endOptions, nextSlotStart } from '@/lib/booking-window'
import { serverErrorMessage } from '@/lib/form'
import {
  addDays,
  formatDuration,
  formatTime,
  parseApiDate,
  toZonedIso,
  zonedDayKey,
  zonedToMs,
} from '@/lib/format'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'
import { activeOverride, endOverride, spotOverridesQuery, startOverride } from '@/queries/overrides'
import type { OverrideType, Spot, SpotOverride } from '@/types/models'

const HOUR_MS = 60 * 60 * 1000
const QUICK_PICKS_MS = [1, 2, 4].map((hours) => hours * HOUR_MS)

/** Overrides change who can book the spot right now, so refresh Find Spot too */
function useInvalidateOverrides(spotId: string) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['spots', spotId, 'overrides'] }),
      queryClient.invalidateQueries({ queryKey: ['spots', 'available'] }),
    ])
}

/** "Today 18:00" / "Tomorrow 09:00": free-until times are never further away than that */
function useUntilLabel() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  return (ms: number, now: number) =>
    `${zonedDayKey(ms) === zonedDayKey(now) ? t('find.today') : t('find.tomorrow')} ${formatTime(ms, language)}`
}

/**
 * "Free now" and "Busy" for one spot: temporary overrides of its weekly schedule. While
 * one is active the card shows it in a banner instead, with a way to end it early.
 */
export function OverrideControls({ spot }: { spot: Spot }) {
  const now = useNow()
  // Not prefetched by the route: the page must keep working while the backend lacks the
  // endpoint. If it fails, the buttons still show and report errors on use.
  const { data: overrides = [] } = useQuery({ ...spotOverridesQuery(spot.id), retry: false })
  const active = activeOverride(overrides, now)

  if (active) return <ActiveOverrideBanner spot={spot} override={active} now={now} />

  return (
    <div className="grid grid-cols-2 gap-2">
      <FreeNowButton spot={spot} now={now} />
      <BusyButton spot={spot} />
    </div>
  )
}

function useStartOverride(spot: Spot, onDone?: () => void) {
  const { t } = useTranslation()
  const invalidate = useInvalidateOverrides(spot.id)
  const untilLabel = useUntilLabel()

  return useMutation({
    mutationFn: (body: { type: OverrideType; endsAt?: number }) =>
      startOverride(spot.id, {
        type: body.type,
        endsAt: body.endsAt === undefined ? undefined : toZonedIso(body.endsAt),
      }),
    onSuccess: async (_, body) => {
      await invalidate()
      toast.success(
        body.type === 'FREE'
          ? t('spots.override.toast.free', {
              number: spot.number,
              time: untilLabel(body.endsAt!, Date.now()),
            })
          : t('spots.override.toast.busy', { number: spot.number }),
      )
      onDone?.()
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })
}

function FreeNowButton({ spot, now }: { spot: Spot; now: number }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        className="h-11 bg-secondary-50 text-secondary-800 hover:bg-secondary-100 hover:text-secondary-800 dark:bg-secondary-950 dark:text-secondary-300"
        onClick={() => setOpen(true)}
      >
        <ZapIcon />
        {t('spots.override.freeNow')}
      </Button>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t('spots.override.freeTitle', { number: spot.number })}
          </DialogTitle>
          <DialogDescription>{t('spots.override.freeDescription')}</DialogDescription>
        </DialogHeader>
        {/* Keyed so reopening starts from fresh times */}
        {open && <FreeUntilForm key={now} spot={spot} now={now} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function FreeUntilForm({ spot, now, onDone }: { spot: Spot; now: number; onDone: () => void }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const untilLabel = useUntilLabel()
  const start = useStartOverride(spot, onDone)
  const selectId = useId()

  // Every half hour from the next slot until the end of tomorrow, like booking windows
  const today = zonedDayKey(now)
  const options = endOptions(nextSlotStart(now) - SLOT_MS, today).filter((ms) => ms > now)
  const endOfDay = zonedToMs(addDays(today, 1), '00:00')
  const quickPicks = [
    ...QUICK_PICKS_MS.map((ms) => ({
      value: nextSlotStart(now + ms),
      label: formatDuration(ms, language),
    })),
    { value: endOfDay, label: t('spots.override.endOfDay') },
  ]
    .filter((pick) => options.includes(pick.value))
    // Near midnight "End of day" comes before "1 h"
    .sort((a, b) => a.value - b.value)
  const [until, setUntil] = useState(quickPicks[1]?.value ?? options[0])

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-1.5">
        {quickPicks.map((pick) => (
          <Button
            key={pick.value}
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={until === pick.value}
            className={cn(
              'rounded-full',
              until === pick.value &&
                'border-primary bg-primary-50 text-primary dark:bg-primary-950',
            )}
            onClick={() => setUntil(pick.value)}
          >
            {pick.label}
          </Button>
        ))}
      </div>
      <div className="grid gap-2">
        <Label htmlFor={selectId} className="font-medium">
          {t('spots.override.until')}
        </Label>
        <select
          id={selectId}
          value={until}
          onChange={(e) => setUntil(Number(e.target.value))}
          className="h-11 w-full rounded-lg border border-transparent bg-primary-50 px-3 text-base tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        >
          {options.map((ms) => (
            <option key={ms} value={ms}>
              {untilLabel(ms, now)}
            </option>
          ))}
        </select>
      </div>
      <Button
        size="lg"
        className="h-12 w-full text-base"
        disabled={start.isPending || until === undefined}
        onClick={() => start.mutate({ type: 'FREE', endsAt: until })}
      >
        {start.isPending && <Loader2Icon className="animate-spin" />}
        {t('spots.override.confirmFree', { time: untilLabel(until, now) })}
      </Button>
    </div>
  )
}

function BusyButton({ spot }: { spot: Spot }) {
  const { t } = useTranslation()
  const start = useStartOverride(spot)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-11 bg-tertiary-50 text-tertiary-800 hover:bg-tertiary-100 hover:text-tertiary-800 dark:bg-tertiary-950 dark:text-tertiary-300"
          disabled={start.isPending}
        >
          {start.isPending ? <Loader2Icon className="animate-spin" /> : <BanIcon />}
          {t('spots.override.busy')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('spots.override.busyTitle', { number: spot.number })}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('spots.override.busyDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => start.mutate({ type: 'BUSY' })}>
            {t('spots.override.busyConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
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
        {isFree && override.endsAt
          ? t('spots.override.bannerFree', { time: untilLabel(parseApiDate(override.endsAt), now) })
          : t('spots.override.bannerBusy')}
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
