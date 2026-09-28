import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CarIcon, TagIcon } from 'lucide-react'
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
import type { components } from '@/types/api'

type Car = components['schemas']['CarRead']

// Mirrors CarCreate in the backend, which also upper-cases the plate
const carFormSchema = z.object({
  plate: z
    .string()
    .trim()
    .min(1, 'validation.plateRequired')
    .max(20, 'validation.plateMax')
    .regex(/^[\p{L}\d][\p{L}\d -]*$/u, 'validation.plate'),
  nickname: z.string().trim().max(100, 'validation.nicknameMax'),
  is_default: z.boolean(),
})

type CarFormValues = z.infer<typeof carFormSchema>

interface CarFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Car to edit; omit to add a new one */
  car?: Car
  /** Whether the user already has cars — the first one always becomes the default */
  hasCars: boolean
}

export function CarFormDialog({ open, onOpenChange, car, hasCars }: CarFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <CarForm
          key={car?.id ?? 'new'}
          car={car}
          hasCars={hasCars}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function CarForm({ car, hasCars, onDone }: { car?: Car; hasCars: boolean; onDone: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isFirstCar = !car && !hasCars

  const save = useMutation({
    mutationFn: (values: CarFormValues) => {
      const plate = values.plate.toUpperCase()
      const nickname = values.nickname || null
      if (!car) return createCar({ plate, nickname, is_default: values.is_default })
      // Only ever send `true` on edit: unsetting could leave the user without a default
      return updateCar(car.id, { plate, nickname, ...(values.is_default && { is_default: true }) })
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['cars'] })
      toast.success(t(car ? 'cars.toast.updated' : 'cars.toast.added', { plate: saved.plate }))
      onDone()
    },
  })

  const defaultValues: CarFormValues = {
    plate: car?.plate ?? '',
    nickname: car?.nickname ?? '',
    is_default: car?.is_default ?? isFirstCar,
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
        <form.AppField name="nickname">
          {(field) => (
            <field.TextField
              label={t('cars.form.nickname')}
              icon={TagIcon}
              autoComplete="off"
              placeholder={t('cars.form.nicknamePlaceholder')}
              hint={t('cars.form.nicknameHint')}
            />
          )}
        </form.AppField>
        {/* The current default stays default until another car takes over */}
        {car?.is_default ? (
          <p className="rounded-lg bg-primary-50 px-3 py-2.5 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200">
            {t('cars.form.isDefaultNote')}
          </p>
        ) : isFirstCar ? (
          <p className="rounded-lg bg-primary-50 px-3 py-2.5 text-sm text-primary-800 dark:bg-primary-950 dark:text-primary-200">
            {t('cars.form.firstCarNote')}
          </p>
        ) : (
          <form.AppField name="is_default">
            {(field) => <field.CheckboxField label={t('cars.form.makeDefault')} />}
          </form.AppField>
        )}
        <form.AppForm>
          <form.SubmitButton>{car ? t('cars.form.save') : t('cars.form.add')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </>
  )
}
