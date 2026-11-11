import { Link, useNavigate } from '@tanstack/react-router'
import type { SortingState } from '@tanstack/react-table'
import { FileTextIcon, MapPinIcon, SquareParkingIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { columnHelper } from '@/components/data-table/features'
import { SpotReviewActions } from '@/components/buildings/spot-review-actions'
import { SpotStatusBadge } from '@/components/spots/spot-status-badge'
import { UndergroundBadge } from '@/components/spots/underground-badge'
import { formatDate } from '@/lib/format'
import { displayName } from '@/lib/users'
import type { AdminSpot, Spot } from '@/types/models'

interface SpotReviewTableProps {
  buildingId: string
  spots: AdminSpot[]
  onViewDocument: (spot: Spot) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}

const mapsUrl = (spot: Spot) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.lat},${spot.long}`)}`

// Review order, the same as the status tabs
const statusOrder: Spot['status'][] = ['PENDING', 'CONFIRMED', 'REJECTED']

const col = columnHelper<AdminSpot>()

/**
 * The admin's review table: owner, status, proof document, map link and approve/reject.
 * Clicking a row opens the spot's page with its schedule and reservations.
 */
export function SpotReviewTable({
  buildingId,
  spots,
  onViewDocument,
  sorting,
  onSortingChange,
}: SpotReviewTableProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const navigate = useNavigate()

  const columns = col.columns([
    col.accessor('number', {
      header: t('buildings.spots.columns.number'),
      meta: { rowHeader: true },
      cell: ({ row: { original: spot } }) => (
        // The keyboard-reachable way into the spot; the row click is a mouse shortcut
        <Link
          to="/building/$buildingId/spots/$spotId"
          params={{ buildingId, spotId: spot.id }}
          aria-label={t('buildings.spots.open', { number: spot.number })}
          className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-50 text-base font-bold text-primary outline-none hover:bg-primary-100 focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-primary-950"
        >
          {spot.number}
        </Link>
      ),
    }),
    col.accessor('description', {
      header: t('buildings.spots.columns.description'),
      meta: { cellClassName: 'max-w-56 text-muted-foreground' },
      cell: ({ getValue }) => <span className="line-clamp-2">{getValue()}</span>,
    }),
    col.accessor((spot) => (spot.owner ? displayName(spot.owner) || spot.owner.email : undefined), {
      id: 'owner',
      header: t('buildings.spots.columns.owner'),
      meta: { cellClassName: 'max-w-56' },
      cell: ({ row }) => <OwnerCell owner={row.original.owner} />,
    }),
    col.accessor((spot) => statusOrder.indexOf(spot.status), {
      id: 'status',
      header: t('buildings.spots.columns.status'),
      cell: ({ row: { original: spot } }) => (
        <div
          className="flex flex-wrap gap-1.5"
          // The full reason is on the spot's page; a hover is enough in the list
          title={spot.rejectionReason ?? undefined}
        >
          <SpotStatusBadge status={spot.status} />
          {spot.underground && <UndergroundBadge />}
        </div>
      ),
    }),
    col.accessor('updatedAt', {
      header: t('buildings.spots.columns.submitted'),
      meta: { cellClassName: 'whitespace-nowrap text-muted-foreground tabular-nums' },
      cell: ({ getValue }) => formatDate(getValue(), language),
    }),
    // Spots with a document to check come first
    col.accessor((spot) => (spot.status === 'PENDING' && spot.fileId ? 0 : 1), {
      id: 'document',
      header: t('buildings.spots.columns.document'),
      cell: ({ row: { original: spot } }) =>
        spot.status === 'PENDING' && spot.fileId ? (
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
          <span className="text-muted-foreground">{t('buildings.spots.document.none')}</span>
        ),
    }),
    col.display({
      id: 'location',
      header: t('buildings.spots.columns.location'),
      cell: ({ row: { original: spot } }) => (
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
      ),
    }),
    col.display({
      id: 'actions',
      header: t('buildings.spots.columns.actions'),
      meta: { srOnlyHeader: true },
      cell: ({ row }) => <SpotReviewActions buildingId={buildingId} spot={row.original} />,
    }),
  ])

  return (
    // Eight columns don't fit a phone; the table scrolls sideways inside its card
    <DataTable
      data={spots}
      columns={columns}
      getRowId={(spot) => spot.id}
      sorting={sorting}
      onSortingChange={onSortingChange}
      onRowClick={(spot) =>
        void navigate({
          to: '/building/$buildingId/spots/$spotId',
          params: { buildingId, spotId: spot.id },
        })
      }
      className="min-w-4xl"
    />
  )
}

function OwnerCell({ owner }: { owner: AdminSpot['owner'] }) {
  const { t } = useTranslation()
  if (!owner)
    return <span className="text-muted-foreground">{t('buildings.spots.unknownOwner')}</span>
  const name = displayName(owner)
  return (
    <span className="grid min-w-0">
      <span className="truncate font-semibold">{name || owner.email}</span>
      {name && <span className="truncate text-muted-foreground">{owner.email}</span>}
    </span>
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
