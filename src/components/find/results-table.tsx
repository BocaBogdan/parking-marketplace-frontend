import type { SortingState } from '@tanstack/react-table'
import { SearchXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { columnHelper } from '@/components/data-table/features'
import { UndergroundBadge } from '@/components/spots/underground-badge'
import type { Spot } from '@/types/models'

interface ResultsTableProps {
  spots: Spot[]
  onReserve: (spot: Spot) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}

const col = columnHelper<Spot>()

export function ResultsTable({ spots, onReserve, sorting, onSortingChange }: ResultsTableProps) {
  const { t } = useTranslation()

  if (spots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
        <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchXIcon className="size-6" />
        </div>
        <h3 className="font-semibold">{t('find.empty.title')}</h3>
        <p className="max-w-xs text-sm text-muted-foreground">{t('find.empty.description')}</p>
      </div>
    )
  }

  const columns = col.columns([
    col.accessor('number', {
      header: t('find.table.spot'),
      meta: { rowHeader: true, cellClassName: 'whitespace-nowrap' },
      cell: ({ getValue }) => (
        <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-50 text-base font-bold text-primary dark:bg-primary-950">
          {getValue()}
        </span>
      ),
    }),
    // Spots without details sort last
    col.accessor((spot) => spot.description || undefined, {
      id: 'details',
      header: t('find.table.details'),
      meta: { cellClassName: 'text-muted-foreground' },
      cell: ({ row: { original: spot } }) => (
        <>
          {spot.underground && <UndergroundBadge />}
          <span className="line-clamp-2">{spot.description || t('find.table.noDetails')}</span>
        </>
      ),
    }),
    col.display({
      id: 'actions',
      header: t('find.table.actions'),
      meta: { srOnlyHeader: true, cellClassName: 'text-right' },
      cell: ({ row }) => (
        <Button size="lg" className="h-9 px-4" onClick={() => onReserve(row.original)}>
          {t('find.reserve')}
        </Button>
      ),
    }),
  ])

  return (
    <DataTable
      data={spots}
      columns={columns}
      getRowId={(spot) => spot.id}
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  )
}
