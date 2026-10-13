import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { components } from '@/types/api'
import type { Schedule } from '@/types/models'

export function spotSchedulesQuery(spotId: string) {
  return queryOptions({
    queryKey: ['spots', spotId, 'schedules'],
    queryFn: () =>
      unwrap<Schedule[]>(api.GET('/api/spot/{spotId}/schedule', { params: { path: { spotId } } })),
  })
}

/** One entry per day */
export function createSchedules(
  spotId: string,
  body: components['schemas']['CreateScheduleDto'][],
) {
  return unwrap<Schedule[]>(
    api.POST('/api/spot/{spotId}/schedule', { params: { path: { spotId } }, body }),
  )
}

export function deleteSchedule(spotId: string, scheduleId: string) {
  return unwrap(
    api.DELETE('/api/spot/{spotId}/schedule/{id}', {
      params: { path: { spotId, id: scheduleId } },
    }),
  )
}

export function updateSchedule(
  spotId: string,
  scheduleId: string,
  body: components['schemas']['UpdateScheduleDto'],
) {
  return unwrap<Schedule>(
    api.PATCH('/api/spot/{spotId}/schedule/{id}', {
      params: { path: { spotId, id: scheduleId } },
      body,
    }),
  )
}
