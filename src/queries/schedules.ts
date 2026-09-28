import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { components } from '@/types/api'

export function spotSchedulesQuery(spotId: string) {
  return queryOptions({
    queryKey: ['spots', spotId, 'schedules'],
    queryFn: () =>
      unwrap(
        api.GET('/api/v1/spots/{spot_id}/schedules/', { params: { path: { spot_id: spotId } } }),
      ),
  })
}

/** Creates one schedule row per day */
export function createSchedules(spotId: string, body: components['schemas']['ScheduleCreate']) {
  return unwrap(
    api.POST('/api/v1/spots/{spot_id}/schedules/', {
      params: { path: { spot_id: spotId } },
      body,
    }),
  )
}

export function deleteSchedule(spotId: string, scheduleId: string) {
  return unwrap(
    api.DELETE('/api/v1/spots/{spot_id}/schedules/{schedule_id}', {
      params: { path: { spot_id: spotId, schedule_id: scheduleId } },
    }),
  )
}
