import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon, Trash2Icon } from 'lucide-react'
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
import { deleteCar } from '@/queries/cars'
import type { components } from '@/types/api'

interface RemoveCarButtonProps {
  car: components['schemas']['CarRead']
  /** Removing the default car hands the role to another one — say so in the confirmation */
  hasOtherCars: boolean
}

export function RemoveCarButton({ car, hasOtherCars }: RemoveCarButtonProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const remove = useMutation({
    mutationFn: () => deleteCar(car.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success(t('cars.toast.removed', { plate: car.plate }))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="text-muted-foreground hover:text-destructive"
          aria-label={t('cars.remove', { plate: car.plate })}
          disabled={remove.isPending}
        >
          {remove.isPending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('cars.removeConfirm.title', { plate: car.plate })}</AlertDialogTitle>
          <AlertDialogDescription>
            {car.is_default && hasOtherCars
              ? t('cars.removeConfirm.defaultDescription')
              : t('cars.removeConfirm.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => remove.mutate()}>
            {t('cars.removeConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
