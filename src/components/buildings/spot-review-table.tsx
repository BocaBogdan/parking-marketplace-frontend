import { FileTextIcon, MapPinIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { SpotReviewActions } from '@/components/buildings/spot-review-actions'
import { SpotStatusBadge } from '@/components/spots/spot-status-badge'
import { formatDate } from '@/lib/format'
import type { ReviewableSpot as Spot } from '@/types/models'

/**
 * Not in the first release (no review status or documents in the API): the admin's review
 * table with status, proof document, map link and approve/reject.
 */
interface SpotReviewTableProps {
  buildingId: string
  spots: Spot[]
  onViewDocument: (spot: Spot) => void
}

const mapsUrl = (spot: Spot) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.lat},${spot.long}`)}`

export function SpotReviewTable({ buildingId, spots, onViewDocument }: SpotReviewTableProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'

  return (
    // Seven columns don't fit a phone; the table scrolls sideways inside its card
    <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
      <table className="w-full min-w-3xl text-left text-sm">
        <thead className="border-b bg-muted/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.number')}
            </th>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.description')}
            </th>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.status')}
            </th>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.submitted')}
            </th>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.document')}
            </th>
            <th scope="col" className="px-4 py-3">
              {t('buildings.spots.columns.location')}
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">{t('buildings.spots.columns.actions')}</span>
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
              <td className="max-w-56 px-4 py-3 text-muted-foreground">
                <span className="line-clamp-2">{spot.description}</span>
              </td>
              <td className="px-4 py-3">
                <SpotStatusBadge status={spot.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                {formatDate(spot.updatedAt, language)}
              </td>
              <td className="px-4 py-3">
                {spot.fileId ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="bg-primary-50 text-primary hover:bg-primary-100 hover:text-primary dark:bg-primary-950"
                    aria-label={t('buildings.spots.document.view', { number: spot.number })}
                    onClick={() => onViewDocument(spot)}
                  >
                    <FileTextIcon />
                    {t('buildings.spots.document.action')}
                  </Button>
                ) : (
                  <span className="text-muted-foreground">
                    {t('buildings.spots.document.none')}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <a
                  href={mapsUrl(spot)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t('buildings.spots.location', { number: spot.number })}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <MapPinIcon className="size-4" />
                  {t('buildings.spots.map')}
                </a>
              </td>
              <td className="px-4 py-3">
                <SpotReviewActions buildingId={buildingId} spot={spot} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
