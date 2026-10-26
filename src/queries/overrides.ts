import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import { parseApiDate } from '@/lib/format'
import type { OverrideType, SpotOverride } from '@/types/models'

/** Owner-only: the spot's "Free now" / "Busy" override that hasn't ended yet */
export function spotOverridesQuery(spotId: string) {
  return queryOptions({
    queryKey: ['spots', spotId, 'overrides'],
    queryFn: () =>
      unwrap<SpotOverride[]>(
        api.GET('/api/spot/{spotId}/override', { params: { path: { spotId } } }),
      ),
  })
}

/** The override in effect at `now`, newest first if several overlap */
export function activeOverride(overrides: SpotOverride[], now: number) {
  return overrides
    .filter(
      (o) => parseApiDate(o.startsAt) <= now && (o.endsAt === null || parseApiDate(o.endsAt) > now),
    )
    .sort((a, b) => parseApiDate(b.startsAt) - parseApiDate(a.startsAt))[0]
}

/**
 * Starts now and ends any active override. No `endsAt`: until the owner ends it. BUSY is
 * refused (409) while a reservation overlaps it.
 */
export function startOverride(spotId: string, body: { type: OverrideType; endsAt?: string }) {
  return unwrap<SpotOverride>(
    api.POST('/api/spot/{spotId}/override', { params: { path: { spotId } }, body }),
  )
}

export function endOverride(spotId: string, overrideId: string) {
  return unwrap(
    api.DELETE('/api/spot/{spotId}/override/{id}', {
      params: { path: { spotId, id: overrideId } },
    }),
  )
}
