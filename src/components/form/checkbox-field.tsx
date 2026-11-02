import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useFieldContext } from '@/lib/form-context'

export function CheckboxField({ label, hint }: { label: string; hint?: string }) {
  const field = useFieldContext<boolean>()
  const id = useId()

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2.5">
        <Checkbox
          id={id}
          name={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked === true)}
          onBlur={field.handleBlur}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <Label htmlFor={id} className="font-normal text-muted-foreground">
          {label}
        </Label>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}
