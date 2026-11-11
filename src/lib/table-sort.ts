import type { SortingState } from '@tanstack/react-table'
import { z } from 'zod'

/**
 * `?sort=<column>&dir=asc|desc`, for tables whose order belongs in the URL. Spread into a
 * route's search schema. An unknown column is ignored by the table.
 */
export const sortSearchSchema = {
  sort: z.string().optional().catch(undefined),
  dir: z.enum(['asc', 'desc']).optional().catch(undefined),
}

export interface SortSearch {
  sort?: string
  dir?: 'asc' | 'desc'
}

export const toSorting = ({ sort, dir }: SortSearch): SortingState =>
  sort ? [{ id: sort, desc: dir === 'desc' }] : []

export const fromSorting = (sorting: SortingState): SortSearch => {
  const [first] = sorting
  return first
    ? { sort: first.id, dir: first.desc ? 'desc' : 'asc' }
    : { sort: undefined, dir: undefined }
}
