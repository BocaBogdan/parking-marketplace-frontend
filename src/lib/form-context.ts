import { createFormHookContexts } from '@tanstack/react-form'

// Separate from form.ts so field components can import the contexts without a cycle
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
