import { useMutation } from '@tanstack/react-query'
import { DoorOpenIcon, IdCardIcon, MailIcon } from 'lucide-react'
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
import { inviteResident } from '@/queries/invites'

// Mirrors InviteUserDto; the building goes in the URL
const inviteFormSchema = z.object({
  email: z.string().trim().pipe(z.email('validation.email')),
  apartment: z.string().trim().min(1, 'validation.apartmentRequired'),
  eBlocUserID: z.string().trim().min(1, 'validation.eBlocRequired'),
})

type InviteFormValues = z.input<typeof inviteFormSchema>

const defaultValues: InviteFormValues = { email: '', apartment: '', eBlocUserID: '' }

interface InviteResidentDialogProps {
  buildingId: string
  buildingName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteResidentDialog({
  buildingId,
  buildingName,
  open,
  onOpenChange,
}: InviteResidentDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t('buildings.invite.single.title')}
          </DialogTitle>
          <DialogDescription>
            {t('buildings.invite.single.description', { building: buildingName })}
          </DialogDescription>
        </DialogHeader>
        <InviteForm buildingId={buildingId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function InviteForm({ buildingId, onDone }: { buildingId: string; onDone: () => void }) {
  const { t } = useTranslation()

  const invite = useMutation({
    mutationFn: (values: InviteFormValues) => {
      const { email, apartment, eBlocUserID } = inviteFormSchema.parse(values)
      return inviteResident(buildingId, { email, apartment, eBlocUserID })
    },
    onSuccess: (_, values) => {
      toast.success(t('buildings.invite.toast.sent', { email: values.email.trim() }))
      onDone()
    },
  })

  const form = useAppForm({
    defaultValues,
    validators: { onChange: inviteFormSchema },
    onSubmit: async ({ value, formApi }) => {
      try {
        await invite.mutateAsync(value)
      } catch (error) {
        setServerErrors(formApi, error)
      }
    },
  })

  return (
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
      <form.AppField name="email">
        {(field) => (
          <field.TextField
            label={t('buildings.invite.fields.email')}
            icon={MailIcon}
            type="email"
            autoComplete="off"
            placeholder={t('buildings.invite.fields.emailPlaceholder')}
          />
        )}
      </form.AppField>
      <div className="grid gap-5 sm:grid-cols-2">
        <form.AppField name="apartment">
          {(field) => (
            <field.TextField
              label={t('buildings.invite.fields.apartment')}
              icon={DoorOpenIcon}
              autoComplete="off"
              placeholder={t('buildings.invite.fields.apartmentPlaceholder')}
            />
          )}
        </form.AppField>
        <form.AppField name="eBlocUserID">
          {(field) => (
            <field.TextField
              label={t('buildings.invite.fields.eBloc')}
              icon={IdCardIcon}
              autoComplete="off"
              placeholder={t('buildings.invite.fields.eBlocPlaceholder')}
            />
          )}
        </form.AppField>
      </div>
      <form.AppForm>
        <form.SubmitButton>{t('buildings.invite.single.submit')}</form.SubmitButton>
      </form.AppForm>
    </form>
  )
}
