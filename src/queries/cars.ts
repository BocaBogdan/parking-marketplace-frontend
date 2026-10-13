import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'
import type { components } from '@/types/api'
import type { Car } from '@/types/models'

export const myCarsQuery = queryOptions({
  queryKey: ['cars', 'mine'],
  queryFn: async () => {
    const cars = await unwrap<Car[]>(api.GET('/api/car/mine'))
    return cars.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },
})

export function createCar(body: components['schemas']['CreateCarDto']) {
  return unwrap<Car>(api.POST('/api/car', { body }))
}

/** Responds with a one-element array (the backend uses findBy) */
export async function updateCar(carId: string, body: components['schemas']['UpdateCarDto']) {
  const [car] = await unwrap<Car[]>(
    api.PATCH('/api/car/{id}', { params: { path: { id: carId } }, body }),
  )
  return car
}

export function deleteCar(carId: string) {
  return unwrap(api.DELETE('/api/car/{id}', { params: { path: { id: carId } } }))
}
