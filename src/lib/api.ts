import { getToken } from '@clerk/react'
import createClient from 'openapi-fetch'
import { toast } from 'sonner'
import i18n from '@/i18n'
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

// The API host sleeps when idle, so the first requests after a pause can be slow or fail
const TIMEOUT_MS = 90_000
const RETRIES = 2
const SLOW_NOTICE_MS = 3_000
const WAKING_UP_TOAST_ID = 'api-waking-up'

let slowRequests = 0

/** Shows the "waking up" notice while at least one request has been pending for 3 s. */
async function withSlowNotice(response: Promise<Response>): Promise<Response> {
  let isSlow = false
  const timer = setTimeout(() => {
    isSlow = true
    if (slowRequests++ === 0) {
      toast.loading(i18n.t('errors.wakingUp'), { id: WAKING_UP_TOAST_ID, duration: Infinity })
    }
  }, SLOW_NOTICE_MS)
  try {
    return await response
  } finally {
    clearTimeout(timer)
    if (isSlow && --slowRequests === 0) toast.dismiss(WAKING_UP_TOAST_ID)
  }
}

/** Fetch with a 90 s timeout per attempt, retrying twice on 502/503 and timeouts. */
async function fetchWithRetry(request: Request): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const isLastAttempt = attempt === RETRIES
    try {
      const response = await fetch(
        // Clone so the body can be sent again on a retry
        new Request(request.clone(), {
          signal: AbortSignal.any([request.signal, AbortSignal.timeout(TIMEOUT_MS)]),
        }),
      )
      if (isLastAttempt || (response.status !== 502 && response.status !== 503)) return response
    } catch (error) {
      if (isLastAttempt || (error as Error).name !== 'TimeoutError') throw error
    }
  }
}

export const api = createClient<paths>({
  baseUrl: env.apiUrl,
  fetch: (request) => withSlowNotice(fetchWithRetry(request)),
})

/** Wakes the API on app load so it's ready by the time the user needs it. Fire-and-forget. */
export function warmUpApi() {
  fetch(`${env.apiUrl}/api/health`).catch(() => {})
}

// Clerk caches the session token and refreshes it before it expires
api.use({
  async onRequest({ request }) {
    const token = await getToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    return request
  },
})
