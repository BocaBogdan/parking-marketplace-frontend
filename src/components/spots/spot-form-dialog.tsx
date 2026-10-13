import { useMutation, useQueryClient } from '@tanstack/react-query'
import { HashIcon } from 'lucide-react'
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
import { createSpot, updateSpot } from '@/queries/spots'
import type { Spot } from '@/types/models'

// Mirrors CreateSpotDto in the backend (description is a varchar(255)); messages are
// translation keys. The location picker and proof document aren't in the first release:
// see components/spots/location-picker.tsx and document-input.tsx.
const spotFormSchema = z.object({
  number: z
    .string()
    .trim()
    .regex(/^[1-9]\d{0,8}$/, 'validation.spotNumber'),
  description: z.string().trim().min(1, 'validation.notesRequired').max(255, 'validation.max255'),
})

type SpotFormValues = z.infer<typeof spotFormSchema>

interface SpotFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Spot to edit; omit to register a new one */
  spot?: Spot
}

export function SpotFormDialog({ open, onOpenChange, spot }: SpotFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Keyed so switching spots starts from fresh values */}
        <SpotForm key={spot?.id ?? 'new'} spot={spot} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function SpotForm({ spot, onDone }: { spot?: Spot; onDone: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: (values: SpotFormValues) => {
      const fields = { number: Number(values.number), description: values.description.trim() }
      return spot ? updateSpot(spot.id, fields) : createSpot(fields)
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['spots'] })
      toast.success(
        t(spot ? 'spots.toast.updated' : 'spots.toast.created', { number: saved.number }),
      )
      onDone()
    },
  })

  const defaultValues: SpotFormValues = {
    number: spot ? String(spot.number) : '',
    description: spot?.description ?? '',
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: spotFormSchema },
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
          {spot ? t('spots.form.editTitle', { number: spot.number }) : t('spots.form.createTitle')}
        </DialogTitle>
        <DialogDescription>
          {spot ? t('spots.form.editDescription') : t('spots.form.createDescription')}
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
        <form.AppField name="number">
          {(field) => (
            <field.TextField
              label={t('spots.form.spotNumber')}
              icon={HashIcon}
              inputMode="numeric"
              autoComplete="off"
              placeholder={t('spots.form.spotNumberPlaceholder')}
              hint={t('spots.form.spotNumberHint')}
            />
          )}
        </form.AppField>
        <form.AppField name="description">
          {(field) => (
            <field.TextareaField
              label={t('spots.form.notes')}
              placeholder={t('spots.form.notesPlaceholder')}
              hint={t('spots.form.notesHint')}
              maxLength={255}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton>
            {spot ? t('spots.form.save') : t('spots.form.create')}
          </form.SubmitButton>
        </form.AppForm>
      </form>
    </>
  )
}
