import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { operations } from '@/types/api'
import type { AdminCar, Page } from '@/types/models'

type CarsParams = NonNullable<
  operations['AdminCarController_findByBuilding']['parameters']['query']
>

/** The columns the API sorts cars by */
export const CAR_SORTS = ['plate', 'owner', 'apartment', 'createdAt'] as const
export type CarSort = (typeof CAR_SORTS)[number]

export const CARS_PAGE_SIZE = 20

/**
 * One page of the cars of a building's members, searched and sorted by the API. The
 * previous page stays on screen while the next one loads.
 */
export function buildingCarsQuery(buildingId: string, params: Omit<CarsParams, 'pageSize'>) {
  const query = { ...params, pageSize: CARS_PAGE_SIZE }
  return queryOptions({
    queryKey: ['buildings', buildingId, 'cars', query],
    queryFn: () =>
      unwrap<Page<AdminCar>>(
        api.GET('/api/admin/{buildingId}/car', { params: { path: { buildingId }, query } }),
      ),
    placeholderData: keepPreviousData,
  })
}
