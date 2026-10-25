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
import { serverErrorMessage } from '@/lib/form'
import { setSpotStatus } from '@/queries/admin-spots'
import type { Spot } from '@/types/models'

type Decision = 'CONFIRMED' | 'REJECTED'

/**
 * Approve / Reject for one spot, each confirmed first. A spot only offers the decision
 * it doesn't already have, so an approval can be revoked and a rejection reversed.
 */
export function SpotReviewActions({ buildingId, spot }: { buildingId: string; spot: Spot }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const decide = useMutation({
    mutationFn: (status: Decision) => setSpotStatus(buildingId, spot.id, status),
    onSuccess: async (_, status) => {
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

  const pendingDecision = decide.isPending ? decide.variables : undefined

  return (
    <div className="flex justify-end gap-1.5">
      {spot.status !== 'CONFIRMED' && (
        <DecisionButton
          decision="CONFIRMED"
          number={spot.number}
          disabled={decide.isPending}
          isPending={pendingDecision === 'CONFIRMED'}
          onConfirm={() => decide.mutate('CONFIRMED')}
        />
      )}
      {spot.status !== 'REJECTED' && (
        <DecisionButton
          decision="REJECTED"
          number={spot.number}
          disabled={decide.isPending}
          isPending={pendingDecision === 'REJECTED'}
          onConfirm={() => decide.mutate('REJECTED')}
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
  onConfirm: () => void
}

function DecisionButton({ decision, number, disabled, isPending, onConfirm }: DecisionButtonProps) {
  const { t } = useTranslation()
  const approve = decision === 'CONFIRMED'
  const copy = approve ? 'approve' : 'reject'
  const Icon = isPending ? Loader2Icon : approve ? CheckIcon : XIcon

  return (
    <AlertDialog>
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
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant={approve ? 'default' : 'destructive'} onClick={onConfirm}>
            {t(`buildings.spots.${copy}.action`)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
