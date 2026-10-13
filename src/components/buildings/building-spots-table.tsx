import { SquareParkingIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/format'
import type { Spot } from '@/types/models'

/** Read-only list of the spots registered in a building */
export function BuildingSpotsTable({ spots }: { spots: Spot[] }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.number')}
            </th>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.description')}
            </th>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.registered')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {spots.map((spot) => (
            <tr key={spot.id} className="align-middle">
              <th scope="row" className="px-4 py-3">
                <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-50 text-base font-bold text-primary dark:bg-primary-950">
                  {spot.number}
                </span>
              </th>
              <td className="px-4 py-3 text-muted-foreground">
                <span className="line-clamp-2">{spot.description}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                {formatDate(spot.createdAt, language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function BuildingSpotsEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
      <SquareParkingIcon className="mb-1 size-6 text-muted-foreground" />
      <p className="font-semibold">{message}</p>
    </div>
  )
}
