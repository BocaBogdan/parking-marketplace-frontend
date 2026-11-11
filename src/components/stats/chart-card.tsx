import { useState, type ReactNode } from 'react'
import { ChartColumnIcon, ChartNoAxesColumnIcon, TableIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { columnHelper } from '@/components/data-table/features'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description?: string
  /** The same data as a table, for screen readers and exact values */
  table: ReactNode
  isEmpty?: boolean
  className?: string
  children: ReactNode
}

/** A titled card holding one chart, with a toggle to its table view */
export function ChartCard({
  title,
  description,
  table,
  isEmpty,
  className,
  children,
}: ChartCardProps) {
  const { t } = useTranslation()
  const [showTable, setShowTable] = useState(false)

  return (
    <section
      className={cn(
        'grid min-w-0 content-start gap-4 rounded-2xl border bg-card p-4 shadow-xs sm:p-5',
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="grid gap-0.5">
          <h2 className="font-bold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={showTable}
            onClick={() => setShowTable((shown) => !shown)}
          >
            {showTable ? <ChartColumnIcon /> : <TableIcon />}
            {t(showTable ? 'stats.table.hide' : 'stats.table.show')}
          </Button>
        )}
      </header>
      {isEmpty ? (
        <p className="flex items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-sm text-muted-foreground">
          <ChartNoAxesColumnIcon className="size-4" />
          {t('stats.empty')}
        </p>
      ) : showTable ? (
        <div className="max-h-96 overflow-auto rounded-xl border">{table}</div>
      ) : (
        children
      )}
    </section>
  )
}

type StatsRow = {
  key: string
  cells: ReactNode[]
  /** The raw value of each cell to sort by (cells are formatted); null sorts last */
  values?: (string | number | null)[]
}

const statsCol = columnHelper<StatsRow>()

/**
 * A compact table for a chart's table view. Columns after the first two are numbers.
 * Columns sort by `values` when the rows give them.
 */
export function StatsTable({
  head,
  rows,
  numericFrom = 2,
}: {
  head: string[]
  rows: StatsRow[]
  /** Index of the first right-aligned (numeric) column */
  numericFrom?: number
}) {
  const sortable = rows.length > 0 && rows.every((row) => row.values !== undefined)
  const columns = head.map((label, index) =>
    statsCol.accessor((row) => row.values?.[index] ?? undefined, {
      id: String(index),
      header: label,
      enableSorting: sortable,
      meta: index >= numericFrom ? { align: 'right' as const } : undefined,
      cell: ({ row }) => row.original.cells[index],
    }),
  )
  return <DataTable data={rows} columns={columns} getRowId={(row) => row.key} variant="embedded" />
}

/** The hover card of a chart mark: what it is, then its values */
export function ChartTip({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="grid min-w-32 gap-0.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{title}</p>
      {lines.map((line) => (
        <p key={line} className="text-muted-foreground tabular-nums">
          {line}
        </p>
      ))}
    </div>
  )
}
