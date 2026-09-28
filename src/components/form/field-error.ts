import { translateMessage } from '@/i18n'

// Errors arrive as strings (server) or Standard Schema issues (zod), usually translation keys
export function firstErrorMessage(errors: unknown[]): string | undefined {
  for (const error of errors) {
    if (typeof error === 'string') return translateMessage(error)
    if (error && typeof error === 'object' && 'message' in error) {
      return translateMessage(String(error.message))
    }
  }
  return undefined
}
