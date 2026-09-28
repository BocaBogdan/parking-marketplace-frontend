import { CircleAlertIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { firstErrorMessage } from '@/components/form/field-error'
import { useFormContext } from '@/lib/form-context'

/** Form-level server error, e.g. "Invalid email or password" */
export function FormError() {
  const form = useFormContext()
  // Re-render on language change so the message is re-translated
  useTranslation()

  return (
    <form.Subscribe selector={(state) => state.errorMap.onServer}>
      {(serverError) => {
        const error = firstErrorMessage([serverError])
        if (!error) return null
        return (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )
      }}
    </form.Subscribe>
  )
}
