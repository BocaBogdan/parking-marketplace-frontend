import { useState, type ReactNode } from 'react'
import { ChartColumnIcon, ChartNoAxesColumnIcon, TableIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
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

/** A compact table for a chart's table view. Columns after the first two are numbers. */
export function StatsTable({
  head,
  rows,
  numericFrom = 2,
}: {
  head: string[]
  rows: { key: string; cells: ReactNode[] }[]
  /** Index of the first right-aligned (numeric) column */
  numericFrom?: number
}) {
  const align = (index: number) => (index >= numericFrom ? 'text-right tabular-nums' : '')
  return (
    <table className="w-full text-left text-sm">
      <thead className="sticky top-0 bg-muted text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <tr>
          {head.map((label, index) => (
            <th key={label} scope="col" className={cn('px-3 py-2', align(index))}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((row) => (
          <tr key={row.key}>
            {row.cells.map((cell, index) => (
              <td key={index} className={cn('px-3 py-2', align(index))}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
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
