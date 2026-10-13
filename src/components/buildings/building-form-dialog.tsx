import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2Icon } from 'lucide-react'
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
import { createBuilding } from '@/queries/buildings'

// Mirrors CreateBuildingDto; both columns are varchar(255) in the backend
const buildingFormSchema = z.object({
  name: z.string().trim().min(1, 'validation.buildingNameRequired').max(255, 'validation.max255'),
  description: z
    .string()
    .trim()
    .min(1, 'validation.buildingDescriptionRequired')
    .max(255, 'validation.max255'),
})

type BuildingFormValues = z.infer<typeof buildingFormSchema>

const defaultValues: BuildingFormValues = { name: '', description: '' }

interface BuildingFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BuildingFormDialog({ open, onOpenChange }: BuildingFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <BuildingForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function BuildingForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (values: BuildingFormValues) =>
      createBuilding({ name: values.name.trim(), description: values.description.trim() }),
    onSuccess: async (building) => {
      await queryClient.invalidateQueries({ queryKey: ['buildings'] })
      toast.success(t('buildings.toast.created', { name: building.name }))
      onDone()
    },
  })

  const form = useAppForm({
    defaultValues,
    validators: { onChange: buildingFormSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await create.mutateAsync(value)
      } catch (error) {
        setServerErrors(formApi, error)
      }
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">{t('buildings.form.title')}</DialogTitle>
        <DialogDescription>{t('buildings.form.description')}</DialogDescription>
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
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={t('buildings.form.name')}
              icon={Building2Icon}
              autoComplete="off"
              placeholder={t('buildings.form.namePlaceholder')}
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextareaField
              label={t('buildings.form.descriptionLabel')}
              placeholder={t('buildings.form.descriptionPlaceholder')}
              maxLength={255}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton>{t('buildings.form.submit')}</form.SubmitButton>
        </form.AppForm>
      </form>
    </>
  )
}
