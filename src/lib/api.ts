import { getToken } from '@clerk/react'
import createClient from 'openapi-fetch'
import { env } from '@/lib/env'
import type { paths } from '@/types/api'

/**
 * A non-2xx response. NestJS error bodies look like `{ statusCode, message, error }`, where
 * `message` is a sentence — or, for a failed ValidationPipe, one sentence per invalid field.
 */
export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]

  constructor(status: number, body: unknown) {
    const message = (body as { message?: string | string[] } | undefined)?.message
    const messages = message === undefined ? [] : [message].flat()
    super(messages.join('. ') || `Request failed with status ${status}`)
    this.status = status
    this.messages = messages
  }
}

/**
 * Turns an openapi-fetch result into its data, throwing `ApiError` on failure. The backend
 * doesn't describe its responses yet, so pass the type from `@/types/models` explicitly.
 */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await request
  if (!response.ok) throw new ApiError(response.status, error)
  return data as T
}

export const api = createClient<paths>({ baseUrl: env.apiUrl })

// Clerk caches the session token and refreshes it before it expires
api.use({
  async onRequest({ request }) {
    const token = await getToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
})
