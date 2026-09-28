import createClient from 'openapi-fetch'
import { env } from '@/lib/env'
import { useAuthStore } from '@/stores/auth-store'
import type { components, paths } from '@/types/api'

type ValidationError = components['schemas']['ValidationError']

/** A non-2xx response. `detail` is FastAPI's error body: a message, or per-field errors on 422. */
export class ApiError extends Error {
  readonly status: number
  readonly detail: string | ValidationError[] | undefined

  constructor(status: number, body: unknown) {
    const detail = (body as { detail?: string | ValidationError[] } | undefined)?.detail
    super(typeof detail === 'string' ? detail : `Request failed with status ${status}`)
    this.status = status
    this.detail = detail
  }
}

/** Turns an openapi-fetch result into its data, throwing `ApiError` on failure. */
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await request
  if (!response.ok) throw new ApiError(response.status, error)
  return data as T
}

// For endpoints that don't take a bearer token (login, register, refresh)
export const publicApi = createClient<paths>({ baseUrl: env.apiUrl })

let refreshing: Promise<boolean> | null = null

// Concurrent 401s share one refresh call instead of each spending the refresh token
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const { refreshToken, updateTokens } = useAuthStore.getState()
    if (!refreshToken) return false
    try {
      updateTokens(
        await unwrap(
          publicApi.POST('/api/v1/auth/refresh', { body: { refresh_token: refreshToken } }),
        ),
      )
      return true
    } catch {
      return false
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

function withBearer(request: Request): Request {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) request.headers.set('Authorization', `Bearer ${accessToken}`)
  return request
}

async function authFetch(request: Request): Promise<Response> {
  const retry = request.clone()
  const response = await fetch(withBearer(request))
  if (response.status !== 401 || !useAuthStore.getState().refreshToken) return response

  if (!(await refreshTokens())) {
    useAuthStore.getState().signOut()
    return response
  }
  return fetch(withBearer(retry))
}

// For everything else: attaches the access token and refreshes it once on a 401
export const api = createClient<paths>({ baseUrl: env.apiUrl, fetch: authFetch })
