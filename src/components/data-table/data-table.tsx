import { useState } from 'react'
import { useTable, type RowData, type SortingState, type Updater } from '@tanstack/react-table'
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { dataTableFeatures, type DataColumnDef } from './features'

const variants = {
  /** A page-level table in its own card */
  card: { container: 'rounded-2xl border bg-card shadow-xs', cell: 'px-4 py-3' },
  /** A small table inside a card or dialog */
  compact: { container: 'rounded-xl border', cell: 'px-3 py-2' },
  /** Inside a scrolling box that has its own border: the header sticks to its top */
  embedded: { container: 'overflow-x-visible', cell: 'px-3 py-2' },
}

interface DataTableProps<T extends RowData> {
  data: T[]
  columns: DataColumnDef<T>[]
  getRowId: (row: T) => string
  /** Controlled sorting (e.g. from the URL); leave out to keep it in the table */
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  /** Clicking a row, outside its links and buttons */
  onRowClick?: (row: T) => void
  variant?: keyof typeof variants
  /** For wide tables that scroll sideways on phones, e.g. `min-w-4xl` */
  className?: string
  /** Read by screen readers only */
  caption?: string
}

/**
 * The app's table. Columns are TanStack column definitions (build them with
 * `columnHelper<T>()` from `./features`). Columns with an accessor sort when their header
 * is clicked (ascending, descending, then back to the data's own order); give a column
 * `enableSorting: false` to opt out. Values that are `undefined` always sort last.
 */
export function DataTable<T extends RowData>({
  data,
  columns,
  getRowId,
  sorting: controlledSorting,
  onSortingChange,
  onRowClick,
  variant = 'card',
  className,
  caption,
}: DataTableProps<T>) {
  const { t } = useTranslation()
  const [ownSorting, setOwnSorting] = useState<SortingState>([])
  const sorting = controlledSorting ?? ownSorting
  const setSorting = (updater: Updater<SortingState>) => {
    const next = typeof updater === 'function' ? updater(sorting) : updater
    if (onSortingChange) onSortingChange(next)
    else setOwnSorting(next)
  }

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId: (row) => getRowId(row),
    defaultColumn: { sortFn: 'smart', sortUndefined: 'last' },
    enableMultiSort: false,
    state: { sorting },
    onSortingChange: setSorting,
  })
  const styles = variants[variant]

  return (
    <Table containerClassName={styles.container} className={className}>
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader className={cn(variant === 'embedded' && 'sticky top-0 border-b-0 bg-muted')}>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => {
              const meta = header.column.columnDef.meta
              const label =
                typeof header.column.columnDef.header === 'string'
                  ? header.column.columnDef.header
                  : header.id
              const sorted = header.column.getIsSorted()
              const right = meta?.align === 'right'
              return (
                <TableHead
                  key={header.id}
                  scope="col"
                  aria-sort={
                    sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined
                  }
                  className={cn(styles.cell, right && 'text-right', meta?.headerClassName)}
                >
                  {header.isPlaceholder ? null : meta?.srOnlyHeader ? (
                    <span className="sr-only">{label}</span>
                  ) : header.column.getCanSort() ? (
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      aria-label={t('table.sortBy', { column: label })}
                      className={cn(
                        'group inline-flex items-center gap-1 rounded-sm font-semibold tracking-wide uppercase outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
                        right && 'flex-row-reverse',
                        sorted && 'text-foreground',
                      )}
                    >
                      <table.FlexRender header={header} />
                      {sorted === 'asc' ? (
                        <ArrowUpIcon className="size-3.5" />
                      ) : sorted === 'desc' ? (
                        <ArrowDownIcon className="size-3.5" />
                      ) : (
                        <ArrowUpDownIcon className="size-3.5 opacity-40 group-hover:opacity-100" />
                      )}
                    </button>
                  ) : (
                    <table.FlexRender header={header} />
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow
            key={row.id}
            // A mouse shortcut: links and buttons inside the row keep their own action.
            // React bubbles clicks out of portals too, so ignore ones from dialogs.
            onClick={
              onRowClick &&
              ((e) => {
                const target = e.target as HTMLElement
                if (e.currentTarget.contains(target) && !target.closest('a, button')) {
                  onRowClick(row.original)
                }
              })
            }
            className={cn(onRowClick && 'cursor-pointer transition-colors hover:bg-muted/40')}
          >
            {row.getAllCells().map((cell) => {
              const meta = cell.column.columnDef.meta
              const cellClass = cn(
                styles.cell,
                meta?.align === 'right' && 'text-right tabular-nums',
                meta?.cellClassName,
              )
              return meta?.rowHeader ? (
                <th key={cell.id} scope="row" className={cn('font-normal', cellClass)}>
                  <table.FlexRender cell={cell} />
                </th>
              ) : (
                <TableCell key={cell.id} className={cellClass}>
                  <table.FlexRender cell={cell} />
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
