import { SearchXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { components } from '@/types/api'

type Spot = components['schemas']['SpotRead']

interface ResultsTableProps {
  spots: Spot[]
  onReserve: (spot: Spot) => void
}

export function ResultsTable({ spots, onReserve }: ResultsTableProps) {
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

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              {t('find.table.spot')}
            </th>
            <th scope="col" className="px-4 py-3">
              {t('find.table.details')}
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">{t('find.table.actions')}</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {spots.map((spot) => (
            <tr key={spot.id} className="align-middle">
              <th scope="row" className="px-4 py-3 whitespace-nowrap">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-50 text-base font-bold text-primary dark:bg-primary-950">
                  {spot.spot_number}
                </span>
              </th>
              <td className="px-4 py-3 text-muted-foreground">
                <span className="line-clamp-2">{spot.notes || t('find.table.noDetails')}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <Button size="lg" className="h-9 px-4" onClick={() => onReserve(spot)}>
                  {t('find.reserve')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
