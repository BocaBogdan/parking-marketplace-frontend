import {
  constructSortFn,
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'
import i18n from '@/i18n'

/** Per-column presentation, read by DataTable */
export interface DataColumnMeta {
  /** Numbers: right-aligned with tabular digits */
  align?: 'right'
  /** Render this column's cells as `<th scope="row">` (the row's name) */
  rowHeader?: boolean
  /** Keep the header for screen readers only (e.g. an actions column) */
  srOnlyHeader?: boolean
  headerClassName?: string
  cellClassName?: string
}

const collators = new Map<string, Intl.Collator>()
// Natural order ("Apt 2" before "Apt 10"), ignoring case, in the app's language
const collator = () => {
  const language = i18n.resolvedLanguage ?? 'en'
  let found = collators.get(language)
  if (!found) {
    found = new Intl.Collator(language, { numeric: true, sensitivity: 'base' })
    collators.set(language, found)
  }
  return found
}

/** Numbers by value, everything else as text in the app's language */
const sortFn_smart = constructSortFn({
  sort: (a: unknown, b: unknown) =>
    typeof a === 'number' && typeof b === 'number'
      ? a - b
      : collator().compare(String(a), String(b)),
})

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { smart: sortFn_smart },
  columnMeta: {} as DataColumnMeta,
})

export type DataTableFeatures = typeof dataTableFeatures

/**
 * Column definitions for a DataTable of `T` rows. Each column has its own value type, so the
 * list takes any (as TanStack's own `helper.columns()` does).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataColumnDef<T extends RowData> = ColumnDef<DataTableFeatures, T, any>

/** Typed column builder: `const col = columnHelper<Spot>()`, then `col.accessor(…)` */
export const columnHelper = <T extends RowData>() => createColumnHelper<DataTableFeatures, T>()
