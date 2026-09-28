import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { useStore } from '@tanstack/react-form'
import { EyeIcon, EyeOffIcon, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { firstErrorMessage } from '@/components/form/field-error'
import { useFieldContext } from '@/lib/form-context'

interface TextFieldProps extends Omit<
  ComponentProps<'input'>,
  'id' | 'name' | 'value' | 'onChange' | 'onBlur'
> {
  label: string
  icon?: LucideIcon
  /** Rendered at the end of the label row, e.g. a "Forgot password?" link */
  labelAction?: ReactNode
  hint?: string
}

export function TextField({
  label,
  icon: Icon,
  labelAction,
  hint,
  type = 'text',
  className,
  ...props
}: TextFieldProps) {
  const { t } = useTranslation()
  const field = useFieldContext<string>()
  const id = useId()
  const [isPasswordVisible, setPasswordVisible] = useState(false)
  const submissionAttempts = useStore(field.form.store, (state) => state.submissionAttempts)
  // Validation runs on every change, but don't flag a field the user hasn't left yet
  const error =
    field.state.meta.isBlurred || submissionAttempts > 0
      ? firstErrorMessage(field.state.meta.errors)
      : undefined
  const isPassword = type === 'password'
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="font-semibold">
          {label}
        </Label>
        {labelAction}
      </div>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={id}
          name={field.name}
          type={isPassword && isPasswordVisible ? 'text' : type}
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 border-transparent bg-primary-50 px-3 dark:bg-input/30',
            Icon && 'pl-10',
            isPassword && 'pr-11',
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setPasswordVisible(!isPasswordVisible)}
            aria-label={isPasswordVisible ? t('form.hidePassword') : t('form.showPassword')}
            className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {isPasswordVisible ? (
              <EyeOffIcon className="size-4.5" />
            ) : (
              <EyeIcon className="size-4.5" />
            )}
          </button>
        )}
      </div>
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
