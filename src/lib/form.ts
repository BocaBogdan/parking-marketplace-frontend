import { createFormHook, type AnyFormApi } from '@tanstack/react-form'
import { CheckboxField } from '@/components/form/checkbox-field'
import { SubmitButton } from '@/components/form/submit-button'
import { TextField } from '@/components/form/text-field'
import { ApiError } from '@/lib/api'
import { fieldContext, formContext } from '@/lib/form-context'
import type { TranslationKey } from '@/i18n'

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, CheckboxField },
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
}

// 422s for these fields always mean the same thing as the client-side check
const fieldErrorKeys: Record<string, TranslationKey> = {
  email: 'validation.email',
  phone: 'validation.phone',
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
