import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { parseApiDate } from '@/lib/format'
import type { OverrideType, SpotOverride } from '@/types/models'

type Result<T> = Promise<{ data?: T; error?: unknown; response: Response }>
interface Init {
  params: { path: Record<string, string> }
  body?: unknown
}

/*
 * TODO: these routes aren't in the OpenAPI spec yet. Contract agreed for the backend:
 *   GET    /api/spot/{spotId}/override       → SpotOverride[] (active ones only)
 *   POST   /api/spot/{spotId}/override       { type: 'FREE' | 'BUSY', endsAt?: ISO } → SpotOverride
 *          starts now and ends any active override; FREE needs a future endsAt, BUSY has none
 *   DELETE /api/spot/{spotId}/override/{id}  → ends it now
 * Once they exist, re-run gen:api and call `api` directly instead of this untyped view.
 */
const untypedApi = api as unknown as {
  GET<T>(path: string, init: Init): Result<T>
  POST<T>(path: string, init: Init): Result<T>
  DELETE<T>(path: string, init: Init): Result<T>
}

export function spotOverridesQuery(spotId: string) {
  return queryOptions({
    queryKey: ['spots', spotId, 'overrides'],
    queryFn: () =>
      unwrap(
        untypedApi.GET<SpotOverride[]>('/api/spot/{spotId}/override', {
          params: { path: { spotId } },
        }),
      ),
  })
}

/** The override in effect at `now`, newest first if several overlap */
export function activeOverride(overrides: SpotOverride[], now: number) {
  return overrides
    .filter(
      (o) => parseApiDate(o.startsAt) <= now && (o.endsAt === null || parseApiDate(o.endsAt) > now),
    )
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0]
}

export function startOverride(spotId: string, body: { type: OverrideType; endsAt?: string }) {
  return unwrap(
    untypedApi.POST<SpotOverride>('/api/spot/{spotId}/override', {
      params: { path: { spotId } },
      body,
    }),
  )
}

export function endOverride(spotId: string, overrideId: string) {
  return unwrap(
    untypedApi.DELETE<unknown>('/api/spot/{spotId}/override/{id}', {
      params: { path: { spotId, id: overrideId } },
    }),
  )
}
