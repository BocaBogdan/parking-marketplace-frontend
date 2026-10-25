import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { BuildingStats, StatsRange } from '@/types/models'

/** Usage statistics of a building (admins and its building admin) */
export function buildingStatsQuery(buildingId: string, range: StatsRange) {
  return queryOptions({
    queryKey: ['buildings', buildingId, 'stats', range],
    queryFn: () =>
      unwrap<BuildingStats>(
        api.GET('/api/admin/{buildingId}/stats', {
          params: { path: { buildingId }, query: { range } },
        }),
      ),
  })
}
