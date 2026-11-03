import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckIcon, Loader2Icon, XIcon } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { serverErrorMessage } from '@/lib/form'
import { setSpotStatus } from '@/queries/admin-spots'
import type { Spot } from '@/types/models'

type Decision = 'CONFIRMED' | 'REJECTED'

/** Matches the backend's limit on `rejectionReason` */
const REASON_MAX = 500

/**
 * Approve / Reject for one spot, each confirmed first. A spot only offers the decision
 * it doesn't already have, so an approval can be revoked and a rejection reversed.
 * Rejecting needs a reason, which the owner sees on their spot.
 */
export function SpotReviewActions({ buildingId, spot }: { buildingId: string; spot: Spot }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const decide = useMutation({
    mutationFn: ({ status, reason }: { status: Decision; reason?: string }) =>
      setSpotStatus(buildingId, spot.id, status, reason),
    onSuccess: async (_, { status }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buildings', buildingId, 'spots'] }),
        // The owner's list and Find Spot change too, if they're open in this session
        queryClient.invalidateQueries({ queryKey: ['spots'] }),
      ])
      const key = status === 'CONFIRMED' ? 'approved' : 'rejected'
      toast.success(t(`buildings.spots.toast.${key}`, { number: spot.number }))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  const pendingDecision = decide.isPending ? decide.variables?.status : undefined

  return (
    <div className="flex justify-end gap-1.5">
      {spot.status !== 'CONFIRMED' && (
        <DecisionButton
          decision="CONFIRMED"
          number={spot.number}
          disabled={decide.isPending}
          isPending={pendingDecision === 'CONFIRMED'}
          onConfirm={() => decide.mutate({ status: 'CONFIRMED' })}
        />
      )}
      {spot.status !== 'REJECTED' && (
        <DecisionButton
          decision="REJECTED"
          number={spot.number}
          disabled={decide.isPending}
          isPending={pendingDecision === 'REJECTED'}
          onConfirm={(reason) => decide.mutate({ status: 'REJECTED', reason })}
        />
      )}
    </div>
  )
}

interface DecisionButtonProps {
  decision: Decision
  number: number
  disabled: boolean
  isPending: boolean
  /** Gets the trimmed reason when rejecting */
  onConfirm: (reason?: string) => void
}

function DecisionButton({ decision, number, disabled, isPending, onConfirm }: DecisionButtonProps) {
  const { t } = useTranslation()
  const reasonId = useId()
  const [reason, setReason] = useState('')
  const approve = decision === 'CONFIRMED'
  const copy = approve ? 'approve' : 'reject'
  const Icon = isPending ? Loader2Icon : approve ? CheckIcon : XIcon
  const trimmed = reason.trim()

  return (
    // Each opening starts with an empty reason
    <AlertDialog onOpenChange={(open) => !open && setReason('')}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant={approve ? 'default' : 'outline'}
          className={approve ? undefined : 'text-destructive hover:text-destructive'}
          disabled={disabled}
        >
          <Icon className={isPending ? 'animate-spin' : undefined} />
          {t(`buildings.spots.${copy}.action`)}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t(`buildings.spots.${copy}.title`, { number })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t(`buildings.spots.${copy}.description`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!approve && (
          <div className="grid gap-2">
            <Label htmlFor={reasonId} className="font-semibold">
              {t('buildings.spots.reject.reason')}
            </Label>
            <Textarea
              id={reasonId}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('buildings.spots.reject.reasonPlaceholder')}
              maxLength={REASON_MAX}
              rows={3}
              aria-describedby={`${reasonId}-hint`}
            />
            <p
              id={`${reasonId}-hint`}
              className="flex justify-between gap-2 text-sm text-muted-foreground"
            >
              <span>{t('buildings.spots.reject.reasonHint')}</span>
              <span className="tabular-nums">
                {reason.length}/{REASON_MAX}
              </span>
            </p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant={approve ? 'default' : 'destructive'}
            disabled={!approve && !trimmed}
            onClick={() => onConfirm(approve ? undefined : trimmed)}
          >
            {t(`buildings.spots.${copy}.action`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
