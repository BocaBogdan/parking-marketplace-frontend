import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  /** From 1 */
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

/** "Showing 21–40 of 134" with Previous / Next, for lists the API pages */
export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const { t, i18n } = useTranslation()
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const number = new Intl.NumberFormat(i18n.resolvedLanguage)
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label={t('table.pagination.label')}
      className="flex flex-wrap items-center justify-between gap-3 text-sm"
    >
      <p className="text-muted-foreground tabular-nums" aria-live="polite">
        {t('table.pagination.showing', {
          from: number.format(from),
          to: number.format(to),
          total: number.format(total),
        })}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeftIcon />
          {t('table.pagination.previous')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          {t('table.pagination.next')}
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
