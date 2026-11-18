import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UsersRoundIcon } from 'lucide-react'
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
import { firstErrorMessage } from '@/components/form/field-error'
import { setServerErrors, useAppForm } from '@/lib/form'
import { createCommunity, renameCommunity } from '@/queries/communities'
import type { Building, Community } from '@/types/models'

// Mirrors CreateCommunityDto / RenameCommunityDto
const nameSchema = z
  .string()
  .trim()
  .min(1, 'validation.communityNameRequired')
  .max(100, 'validation.max100')
const createSchema = z.object({
  name: nameSchema,
  buildingIds: z.array(z.string()).min(2, 'validation.communityBuildings'),
})
const renameSchema = z.object({ name: nameSchema, buildingIds: z.array(z.string()) })

type CommunityFormValues = z.infer<typeof createSchema>

interface CommunityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Renames this community; without one a new community is created */
  community?: Community
  /** Buildings that can join: those in no community yet */
  freeBuildings: Building[]
}

export function CommunityFormDialog({
  open,
  onOpenChange,
  community,
  freeBuildings,
}: CommunityFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <CommunityForm
          community={community}
          freeBuildings={freeBuildings}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

function CommunityForm({
  community,
  freeBuildings,
  onDone,
}: Omit<CommunityFormDialogProps, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: ({ name, buildingIds }: CommunityFormValues) =>
      community
        ? renameCommunity(community.id, name.trim())
        : createCommunity({ name: name.trim(), buildingIds }),
    onSuccess: async (saved) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['communities'] }),
        queryClient.invalidateQueries({ queryKey: ['buildings'] }),
      ])
      toast.success(
        t(community ? 'communities.toast.renamed' : 'communities.toast.created', {
          name: saved.name,
        }),
      )
      onDone()
    },
  })

  const form = useAppForm({
    defaultValues: { name: community?.name ?? '', buildingIds: [] } as CommunityFormValues,
    validators: { onChange: community ? renameSchema : createSchema },
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
          {t(community ? 'communities.form.renameTitle' : 'communities.form.title')}
        </DialogTitle>
        <DialogDescription>
          {t(community ? 'communities.form.renameDescription' : 'communities.form.description')}
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
        <form.AppField name="name">
          {(field) => (
            <field.TextField
              label={t('communities.form.name')}
              icon={UsersRoundIcon}
              autoComplete="off"
              placeholder={t('communities.form.namePlaceholder')}
            />
          )}
        </form.AppField>
        {!community && (
          <form.Field name="buildingIds">
            {(field) => {
              const error = form.state.submissionAttempts
                ? firstErrorMessage(field.state.meta.errors)
                : undefined
              return (
                <fieldset className="grid gap-2" aria-describedby="community-buildings-hint">
                  <legend className="mb-2 text-sm font-semibold">
                    {t('communities.form.buildings')}
                  </legend>
                  {freeBuildings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('communities.form.noFreeBuildings')}
                    </p>
                  ) : (
                    <div className="grid max-h-64 gap-2 overflow-y-auto">
                      {freeBuildings.map((building) => (
                        <label
                          key={building.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm has-checked:border-primary has-checked:bg-primary-50 dark:has-checked:bg-primary-950"
                        >
                          <input
                            type="checkbox"
                            checked={field.state.value.includes(building.id)}
                            onChange={(e) =>
                              field.handleChange(
                                e.target.checked
                                  ? [...field.state.value, building.id]
                                  : field.state.value.filter((id) => id !== building.id),
                              )
                            }
                            className="size-4 accent-primary"
                          />
                          <span className="font-semibold">{building.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {error ? (
                    <p className="text-sm text-destructive" role="alert">
                      {error}
                    </p>
                  ) : (
                    <p id="community-buildings-hint" className="text-xs text-muted-foreground">
                      {t('communities.form.buildingsHint')}
                    </p>
                  )}
                </fieldset>
              )
            }}
          </form.Field>
        )}
        <form.AppForm>
          <form.SubmitButton>
            {t(community ? 'communities.form.rename' : 'communities.form.submit')}
          </form.SubmitButton>
        </form.AppForm>
      </form>
    </>
  )
}
