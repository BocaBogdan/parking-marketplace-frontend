import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
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
import { deleteSpot } from '@/queries/spots'
import type { components } from '@/types/api'

export function WithdrawSpotButton({ spot }: { spot: components['schemas']['SpotRead'] }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const number = spot.spot_number

  const withdraw = useMutation({
    mutationFn: () => deleteSpot(spot.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['spots'] })
      toast.success(t('spots.toast.withdrawn', { number }))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="lg" disabled={withdraw.isPending}>
          {withdraw.isPending && <Loader2Icon className="animate-spin" />}
          {t('spots.withdraw')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('spots.withdrawConfirm.title', { number })}</AlertDialogTitle>
          <AlertDialogDescription>{t('spots.withdrawConfirm.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => withdraw.mutate()}>
            {t('spots.withdraw')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
