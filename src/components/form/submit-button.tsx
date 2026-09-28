import type { ReactNode } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFormContext } from '@/lib/form-context'

export function SubmitButton({ children }: { children: ReactNode }) {
  const form = useFormContext()

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          {children}
        </Button>
      )}
    </form.Subscribe>
  )
}
