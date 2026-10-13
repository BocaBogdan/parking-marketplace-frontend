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
 * Maps a failed request onto form errors: validation messages about a known field go to
 * that field, anything else becomes a form-level message. The errors clear on the next edit.
 */
export function setServerErrors(form: AnyFormApi, error: unknown) {
  form.setErrorMap({ onServer: toServerErrors(error) })
}

// The backend's checks for these fields mean the same thing as the client-side ones
const fieldErrorKeys: Record<string, TranslationKey> = {
  plate: 'validation.plate',
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

  // NestJS's ValidationPipe sends one sentence per problem, starting with the field name
  // ("plate should not be empty"). Other errors are a single message — sometimes a
  // translation key, e.g. from a stubbed endpoint.
  const fields: Record<string, string> = {}
  const unmatched: string[] = []
  for (const message of error.messages) {
    const field = message.split(' ')[0]
    if (fieldErrorKeys[field]) fields[field] ??= fieldErrorKeys[field]
    else unmatched.push(message)
  }
  const form = unmatched.join('. ') || (error.messages.length ? undefined : error.message)
  return { form, fields }
}
