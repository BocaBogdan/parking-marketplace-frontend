import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CarIcon, PhoneIcon, TagIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FormError } from '@/components/form/form-error'
import { setServerErrors, useAppForm } from '@/lib/form'
import { createCar, updateCar } from '@/queries/cars'
import type { Car } from '@/types/models'

// Mirrors CreateCarDto in the backend; the plate is upper-cased before saving
const carFormSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, 'validation.plateRequired')
    .max(20, 'validation.plateMax')
    .regex(/^[\p{L}\d][\p{L}\d -]*$/u, 'validation.plate'),
  description: z
    .string()
    .trim()
    .min(1, 'validation.carDescriptionRequired')
    .max(100, 'validation.carDescriptionMax'),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{1,14}$/, 'validation.phone'),
})

type CarFormValues = z.infer<typeof carFormSchema>

interface CarFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Car to edit; omit to add a new one */
  car?: Car
}

export function CarFormDialog({ open, onOpenChange, car }: CarFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <CarForm key={car?.id ?? 'new'} car={car} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function CarForm({ car, onDone }: { car?: Car; onDone: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: (values: CarFormValues) => {
      const body = {
        plate: values.plate.trim().toUpperCase(),
        description: values.description.trim(),
        phone: values.phone.trim(),
      }
      return car ? updateCar(car.id, body) : createCar(body)
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success(t(car ? 'cars.toast.updated' : 'cars.toast.added', { plate: saved.plate }))
      onDone()
    },
  })

  const defaultValues: CarFormValues = {
    plate: car?.plate ?? '',
    description: car?.description ?? '',
    phone: car?.phone ?? '',
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: carFormSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await save.mutateAsync(value)
      } catch (error) {
        setServerErrors(formApi, error)
      }
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">
          {car ? t('cars.form.editTitle', { plate: car.plate }) : t('cars.form.addTitle')}
        </DialogTitle>
        <DialogDescription>
          {car ? t('cars.form.editDescription') : t('cars.form.addDescription')}
        </DialogDescription>
      </DialogHeader>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
        className="grid gap-5"
      >
        <form.AppForm>
          <FormError />
        </form.AppForm>
        <form.AppField name="plate">
          {(field) => (
            <field.TextField
              label={t('cars.form.plate')}
              icon={CarIcon}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={t('cars.form.platePlaceholder')}
              className="font-mono tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextField
              label={t('cars.form.description')}
              icon={TagIcon}
              autoComplete="off"
              placeholder={t('cars.form.descriptionPlaceholder')}
              hint={t('cars.form.descriptionHint')}
            />
          )}
        </form.AppField>
        <form.AppField name="phone">
          {(field) => (
            <field.TextField
              label={t('cars.form.phone')}
              icon={PhoneIcon}
              type="tel"
              autoComplete="tel"
              placeholder={t('cars.form.phonePlaceholder')}
              hint={t('cars.form.phoneHint')}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton>{car ? t('cars.form.save') : t('cars.form.add')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </>
  )
}
