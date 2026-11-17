import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2Icon, HashIcon } from 'lucide-react'
import { useState } from 'react'
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
import { firstErrorMessage } from '@/components/form/field-error'
import { FormError } from '@/components/form/form-error'
import { DocumentInput } from '@/components/spots/document-input'
import { LocationPicker } from '@/components/spots/location-picker'
import { setServerErrors, useAppForm } from '@/lib/form'
import { documentSchema } from '@/lib/spot-document'
import { useBuildingNames, useMemberships } from '@/lib/auth'
import { featureFlagsQuery, SPOT_DOCUMENT_NOT_REQUIRED } from '@/queries/feature-flags'
import { createSpot, updateSpot } from '@/queries/spots'
import type { Spot } from '@/types/models'

// Coordinates stay strings, as the backend stores them
const coordinate = (max: number, message: 'validation.latitude' | 'validation.longitude') =>
  z
    .string()
    .trim()
    .min(1, 'validation.locationRequired')
    .refine((value) => Number.isFinite(Number(value)) && Math.abs(Number(value)) <= max, message)

// Mirrors CreateSpotDto in the backend (description is a varchar(255)); messages are
// translation keys. Location and document are only sent on create (see updateSpot), so an
// edit doesn't check them; buildings that don't require a document skip it altogether.
const spotFormSchema = (isNew: boolean, documentRequired: boolean) =>
  z.object({
    number: z
      .string()
      .trim()
      .regex(/^[1-9]\d{0,8}$/, 'validation.spotNumber'),
    description: z.string().trim().min(1, 'validation.notesRequired').max(255, 'validation.max255'),
    underground: z.boolean(),
    lat: isNew ? coordinate(90, 'validation.latitude') : z.string(),
    long: isNew ? coordinate(180, 'validation.longitude') : z.string(),
    document: documentRequired
      ? documentSchema.refine((file) => file !== null, 'validation.documentRequired')
      : documentSchema,
  })

type SpotFormValues = z.infer<ReturnType<typeof spotFormSchema>>

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

  const memberships = useMemberships()
  const buildings = useBuildingNames()
  // Someone in several buildings picks where a new spot goes; an edit keeps its building
  const [buildingId, setBuildingId] = useState(spot?.buildingId ?? memberships[0]?.buildingId)
  // Per building, so the document field follows the building picked
  const { data: flags } = useQuery(featureFlagsQuery(buildingId))
  // The building approves spots without a document, so only rejected ones go back to an admin
  const documentOptional = flags?.includes(SPOT_DOCUMENT_NOT_REQUIRED) ?? false

  // Saving an edit sends the spot back for review; only a pending spot loses nothing by it
  const resubmits =
    spot !== undefined &&
    (documentOptional ? spot.status === 'REJECTED' : spot.status !== 'PENDING')

  const save = useMutation({
    mutationFn: (values: SpotFormValues) => {
      const fields = {
        number: Number(values.number),
        description: values.description.trim(),
        underground: values.underground,
      }
      if (spot) return updateSpot(spot.id, fields)
      return createSpot({
        ...fields,
        location: { lat: values.lat.trim(), long: values.long.trim() },
        buildingId,
        // The schema requires it unless the building doesn't
        document: documentOptional ? undefined : (values.document ?? undefined),
      })
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['spots'] })
      const key = !spot
        ? documentOptional
          ? 'createdLive'
          : 'created'
        : resubmits
          ? 'resubmitted'
          : 'updated'
      toast.success(t(`spots.toast.${key}`, { number: saved.number }))
      onDone()
    },
  })

  const defaultValues: SpotFormValues = {
    number: spot ? String(spot.number) : '',
    description: spot?.description ?? '',
    underground: spot?.underground ?? false,
    lat: spot?.lat ?? '',
    long: spot?.long ?? '',
    document: null,
  }

  const form = useAppForm({
    defaultValues,
    validators: { onChange: spotFormSchema(spot === undefined, !spot && !documentOptional) },
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
          {!spot
            ? t('spots.form.createTitle')
            : t(resubmits ? 'spots.form.resubmitTitle' : 'spots.form.editTitle', {
                number: spot.number,
              })}
        </DialogTitle>
        <DialogDescription>
          {!spot
            ? t(
                documentOptional
                  ? 'spots.form.createDescriptionNoReview'
                  : 'spots.form.createDescription',
              )
            : t(resubmits ? 'spots.form.resubmitDescription' : 'spots.form.editDescription')}
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
        {!spot && buildings.show && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">{t('spots.form.building')}</legend>
            {memberships.map((membership) => (
              <label
                key={membership.buildingId}
                className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm has-checked:border-primary has-checked:bg-primary-50 dark:has-checked:bg-primary-950"
              >
                <input
                  type="radio"
                  name="building"
                  value={membership.buildingId}
                  checked={buildingId === membership.buildingId}
                  onChange={() => setBuildingId(membership.buildingId)}
                  className="size-4 accent-primary"
                />
                <span className="grid">
                  <span className="font-semibold">{membership.building.name}</span>
                  {membership.apartment && (
                    <span className="text-muted-foreground">
                      {t('home.apartment', { number: membership.apartment })}
                    </span>
                  )}
                </span>
              </label>
            ))}
            <p className="text-xs text-muted-foreground">{t('spots.form.buildingHint')}</p>
          </fieldset>
        )}
        {spot && buildings.show && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2Icon className="size-4 text-primary" />
            {buildings.nameOf(spot.buildingId)}
          </p>
        )}
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
        <form.AppField name="underground">
          {(field) => (
            <field.CheckboxField
              label={t('spots.form.underground')}
              hint={t('spots.form.undergroundHint')}
            />
          )}
        </form.AppField>
        {!spot && (
          <>
            <form.Subscribe
              selector={(state) => ({
                lat: state.values.lat,
                long: state.values.long,
                latErrors: state.fieldMeta.lat?.errors,
                longErrors: state.fieldMeta.long?.errors,
                submitted: state.submissionAttempts > 0,
              })}
            >
              {({ lat, long, latErrors = [], longErrors = [], submitted }) => (
                <LocationPicker
                  value={{ lat, long }}
                  onChange={(value) => {
                    form.setFieldValue('lat', value.lat)
                    form.setFieldValue('long', value.long)
                  }}
                  error={submitted ? firstErrorMessage([...latErrors, ...longErrors]) : undefined}
                  manualFields={
                    <>
                      <form.AppField name="lat">
                        {(field) => (
                          <field.TextField
                            label={t('spots.form.latitude')}
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="46.770439"
                          />
                        )}
                      </form.AppField>
                      <form.AppField name="long">
                        {(field) => (
                          <field.TextField
                            label={t('spots.form.longitude')}
                            inputMode="decimal"
                            autoComplete="off"
                            placeholder="23.591423"
                          />
                        )}
                      </form.AppField>
                    </>
                  }
                />
              )}
            </form.Subscribe>
            {!documentOptional && (
              <form.Field name="document">
                {(field) => (
                  <form.Subscribe selector={(state) => state.submissionAttempts > 0}>
                    {(submitted) => (
                      <DocumentInput
                        file={field.state.value}
                        hasDocumentOnFile={false}
                        onChange={(file) => field.handleChange(file)}
                        // Shown right away for a wrong file; "required" only once they submit
                        error={
                          field.state.value || submitted
                            ? firstErrorMessage(field.state.meta.errors)
                            : undefined
                        }
                      />
                    )}
                  </form.Subscribe>
                )}
              </form.Field>
            )}
          </>
        )}
        <form.AppForm>
          <form.SubmitButton>
            {!spot
              ? t('spots.form.create')
              : t(resubmits ? 'spots.form.resubmit' : 'spots.form.save')}
          </form.SubmitButton>
        </form.AppForm>
      </form>
    </>
  )
}
