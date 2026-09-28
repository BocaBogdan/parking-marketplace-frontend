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
import type { components } from '@/types/api'

type Spot = components['schemas']['SpotRead']

// Mirrors SpotCreate in the backend; messages are translation keys
const spotFormSchema = z.object({
  spot_number: z
    .string()
    .trim()
    .regex(/^[1-9]\d{0,8}$/, 'validation.spotNumber'),
  notes: z.string().max(1000, 'validation.notesMax'),
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
  const mode = !spot ? 'create' : spot.status === 'REJECTED' ? 'resubmit' : 'edit'

  const save = useMutation({
    mutationFn: ({ spot_number, notes }: SpotFormValues) => {
      const body = { spot_number: Number(spot_number), notes: notes.trim() || null }
      return spot ? updateSpot(spot.id, body) : createSpot(body)
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['spots'] })
      const toastKey =
        mode === 'create' ? 'created' : mode === 'resubmit' ? 'resubmitted' : 'updated'
      toast.success(t(`spots.toast.${toastKey}`, { number: saved.spot_number }))
      onDone()
    },
  })

  const defaultValues: SpotFormValues = {
    spot_number: spot ? String(spot.spot_number) : '',
    notes: spot?.notes ?? '',
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

  const number = spot?.spot_number
  const copy = {
    create: {
      title: t('spots.form.createTitle'),
      description: t('spots.form.createDescription'),
      submit: t('spots.form.create'),
    },
    edit: {
      title: t('spots.form.editTitle', { number }),
      description: t('spots.form.editDescription'),
      submit: t('spots.form.save'),
    },
    resubmit: {
      title: t('spots.form.resubmitTitle', { number }),
      description: t('spots.form.resubmitDescription'),
      submit: t('spots.form.resubmit'),
    },
  }[mode]

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-bold">{copy.title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
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
        <form.AppField name="spot_number">
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
        <form.AppField name="notes">
          {(field) => (
            <field.TextareaField
              label={t('spots.form.notes')}
              placeholder={t('spots.form.notesPlaceholder')}
              hint={t('spots.form.notesHint')}
              maxLength={1000}
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton>{copy.submit}</form.SubmitButton>
        </form.AppForm>
      </form>
    </>
  )
}
