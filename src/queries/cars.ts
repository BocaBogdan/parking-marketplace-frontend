import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { components } from '@/types/api'

export const myCarsQuery = queryOptions({
  queryKey: ['cars', 'mine'],
  queryFn: () => unwrap(api.GET('/api/v1/users/me/cars/')),
})

/** The first car a user adds becomes the default automatically (backend rule) */
export function createCar(body: components['schemas']['CarCreate']) {
  return unwrap(api.POST('/api/v1/users/me/cars/', { body }))
}

/** `is_default: true` also clears the flag on the user's other cars (backend rule) */
export function updateCar(carId: string, body: components['schemas']['CarUpdate']) {
  return unwrap(
    api.PUT('/api/v1/users/me/cars/{car_id}', { params: { path: { car_id: carId } }, body }),
  )
}

/** Soft-deletes; removing the default car promotes the newest remaining car (backend rule) */
export function deleteCar(carId: string) {
  return unwrap(
    api.DELETE('/api/v1/users/me/cars/{car_id}', { params: { path: { car_id: carId } } }),
  )
}
