import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SortingState } from '@tanstack/react-table'
import { Loader2Icon, SearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { BuildingSpotsEmpty } from '@/components/buildings/spot-review-table'
import { LicensePlate } from '@/components/cars/license-plate'
import { DataTable } from '@/components/data-table/data-table'
import { columnHelper } from '@/components/data-table/features'
import { Pagination } from '@/components/data-table/pagination'
import { serverErrorMessage } from '@/lib/form'
import { formatDate } from '@/lib/format'
import { displayName } from '@/lib/users'
import { buildingCarsQuery, CAR_SORTS, CARS_PAGE_SIZE, type CarSort } from '@/queries/admin-cars'
import type { AdminCar } from '@/types/models'

const SEARCH_DELAY_MS = 300

const col = columnHelper<AdminCar>()

interface BuildingCarsProps {
  buildingId: string
  /** The search in the URL */
  query: string
  page: number
  sorting: SortingState
  onSearch: (query: string) => void
  onPageChange: (page: number) => void
  onSortingChange: (sorting: SortingState) => void
}

/** The Cars tab: every car of the building's members, searched, sorted and paged by the API */
export function BuildingCars({
  buildingId,
  query,
  page,
  sorting,
  onSearch,
  onPageChange,
  onSortingChange,
}: BuildingCarsProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'

  // Typing updates the box at once and the URL (so the request) once they pause
  const [draft, setDraft] = useState(query)
  useEffect(() => {
    if (draft.trim() === query) return
    const timer = setTimeout(() => onSearch(draft.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draft, query, onSearch])

  // Only the columns the API sorts by; anything else in the URL is ignored
  const [first] = sorting
  const sort = CAR_SORTS.find((key) => key === first?.id) as CarSort | undefined
  const { data, error, isPending, isFetching } = useQuery(
    buildingCarsQuery(buildingId, {
      q: query || undefined,
      page,
      sort,
      dir: sort ? (first.desc ? 'desc' : 'asc') : undefined,
    }),
  )

  const columns = col.columns([
    col.accessor('plate', {
      header: t('buildings.cars.columns.plate'),
      meta: { rowHeader: true },
      cell: ({ getValue }) => <LicensePlate plate={getValue()} size="sm" />,
    }),
    col.accessor((car) => car.owner?.email, {
      id: 'owner',
      header: t('buildings.cars.columns.owner'),
      meta: { cellClassName: 'max-w-56' },
      cell: ({ row: { original: car } }) =>
        car.owner ? (
          <span className="grid min-w-0">
            <span className="truncate font-semibold">
              {displayName(car.owner) || car.owner.email}
            </span>
            {displayName(car.owner) && (
              <span className="truncate text-muted-foreground">{car.owner.email}</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">{t('buildings.cars.unknownOwner')}</span>
        ),
    }),
    col.accessor('apartment', {
      header: t('buildings.cars.columns.apartment'),
      cell: ({ getValue }) => getValue() || '—',
    }),
    col.accessor('phone', {
      header: t('buildings.cars.columns.phone'),
      enableSorting: false,
      meta: { cellClassName: 'whitespace-nowrap' },
      cell: ({ getValue }) => (
        <a href={`tel:${getValue()}`} className="font-semibold text-primary hover:underline">
          {getValue()}
        </a>
      ),
    }),
    col.accessor('description', {
      header: t('buildings.cars.columns.description'),
      enableSorting: false,
      meta: { cellClassName: 'max-w-56 text-muted-foreground' },
      cell: ({ getValue }) => <span className="line-clamp-2">{getValue()}</span>,
    }),
    col.accessor('createdAt', {
      header: t('buildings.cars.columns.added'),
      meta: { cellClassName: 'whitespace-nowrap text-muted-foreground tabular-nums' },
      cell: ({ getValue }) => formatDate(getValue(), language),
    }),
  ])

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t('buildings.cars.search')}
            placeholder={t('buildings.cars.searchPlaceholder')}
            maxLength={100}
            className="h-11 border-transparent bg-primary-50 pl-10 dark:bg-input/30"
          />
        </div>
        {isFetching && <Loader2Icon className="size-5 animate-spin text-muted-foreground" />}
      </div>

      {isPending ? (
        <div className="flex justify-center py-16">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {serverErrorMessage(error)}
        </p>
      ) : data.items.length === 0 ? (
        <BuildingSpotsEmpty
          message={query ? t('buildings.cars.noMatches', { query }) : t('buildings.cars.empty')}
        />
      ) : (
        <>
          <DataTable
            data={data.items}
            columns={columns}
            getRowId={(car) => car.id}
            sorting={sorting}
            onSortingChange={onSortingChange}
            manualSorting
            className="min-w-3xl"
          />
          <Pagination
            page={data.page}
            pageSize={CARS_PAGE_SIZE}
            total={data.total}
            onPageChange={onPageChange}
          />
        </>
      )}
    </div>
  )
}
