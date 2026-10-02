import { createFormHook, type AnyFormApi } from '@tanstack/react-form'
import { CheckboxField } from '@/components/form/checkbox-field'
import { SubmitButton } from '@/components/form/submit-button'
import { TextField } from '@/components/form/text-field'
import { TextareaField } from '@/components/form/textarea-field'
import { ApiError } from '@/lib/api'
import { fieldContext, formContext } from '@/lib/form-context'
import { translateMessage, type TranslationKey } from '@/i18n'

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, TextareaField, CheckboxField },
  formComponents: { SubmitButton },
})

/**
 * Maps a failed request onto form errors: FastAPI 422s go to the matching fields,
 * anything else becomes a form-level message. The errors clear on the next edit.
 */
export function setServerErrors(form: AnyFormApi, error: unknown) {
  form.setErrorMap({ onServer: toServerErrors(error) })
}

// Backend messages we have translations for; unknown ones are shown untranslated
const knownServerErrors: Record<string, TranslationKey> = {
  'Invalid email or password': 'errors.invalidCredentials',
  'A user with this email or phone already exists': 'errors.userExists',
  'This spot already exists': 'errors.spotExists',
  'You do not own this spot': 'errors.notSpotOwner',
  'You already have a car with this plate': 'errors.plateExists',
  'This spot is already reserved for an overlapping window': 'errors.spotTaken',
  'Spot is not available for this window': 'errors.spotUnavailable',
  'You cannot reserve your own spot': 'errors.ownSpot',
  'Reservations can only be cancelled at least 15 minutes before they start': 'errors.cancelCutoff',
  'Reservation is already cancelled': 'errors.alreadyCancelled',
  'One or more of these schedules already exist for this spot': 'errors.scheduleExists',
}

// 422s for these fields always mean the same thing as the client-side check
const fieldErrorKeys: Record<string, TranslationKey> = {
  plate: 'validation.plate',
  email: 'validation.email',
  phone: 'validation.phone',
}

/** A failed request as one translated sentence, for toasts outside forms */
export function serverErrorMessage(error: unknown): string {
  return translateMessage(toServerErrors(error).form ?? 'errors.generic')
}

function toServerErrors(error: unknown): { form?: string; fields: Record<string, string> } {
  if (!(error instanceof ApiError)) {
    return { form: 'errors.network', fields: {} }
  }
  if (!Array.isArray(error.detail)) {
    return { form: knownServerErrors[error.message] ?? error.message, fields: {} }
  }

  const fields: Record<string, string> = {}
  for (const { loc, msg } of error.detail) {
    // loc looks like ['body', 'phone']; pydantic prefixes custom validator messages
    const field = String(loc.at(-1))
    fields[field] ??= fieldErrorKeys[field] ?? msg.replace(/^Value error, /, '')
  }
  return { fields }
}
