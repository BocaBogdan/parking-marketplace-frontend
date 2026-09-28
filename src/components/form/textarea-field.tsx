import { useId, type ComponentProps } from 'react'
import { useStore } from '@tanstack/react-form'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { firstErrorMessage } from '@/components/form/field-error'
import { useFieldContext } from '@/lib/form-context'

interface TextareaFieldProps extends Omit<
  ComponentProps<'textarea'>,
  'id' | 'name' | 'value' | 'onChange' | 'onBlur'
> {
  label: string
  hint?: string
}

export function TextareaField({ label, hint, className, ...props }: TextareaFieldProps) {
  const field = useFieldContext<string>()
  const id = useId()
  const submissionAttempts = useStore(field.form.store, (state) => state.submissionAttempts)
  const error =
    field.state.meta.isBlurred || submissionAttempts > 0
      ? firstErrorMessage(field.state.meta.errors)
      : undefined
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="font-semibold">
        {label}
      </Label>
      <Textarea
        id={id}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'min-h-24 border-transparent bg-primary-50 px-3 py-2.5 dark:bg-input/30',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
