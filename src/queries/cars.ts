import { queryOptions } from '@tanstack/react-query'
import { api, unwrap } from '@/lib/api'

export const myCarsQuery = queryOptions({
  queryKey: ['cars', 'mine'],
  queryFn: () => unwrap(api.GET('/api/v1/users/me/cars/')),
})
