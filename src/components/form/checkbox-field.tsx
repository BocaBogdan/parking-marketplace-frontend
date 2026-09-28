import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useFieldContext } from '@/lib/form-context'

export function CheckboxField({ label }: { label: string }) {
  const field = useFieldContext<boolean>()
  const id = useId()

  return (
    <div className="flex items-center gap-2.5">
      <Checkbox
        id={id}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        onBlur={field.handleBlur}
      />
      <Label htmlFor={id} className="font-normal text-muted-foreground">
        {label}
      </Label>
    </div>
  )
}
