import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import {
  ArrowLeftIcon,
  CalendarClockIcon,
  CalendarXIcon,
  HomeIcon,
  MailIcon,
  MapPinIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { SpotReviewActions } from '@/components/buildings/spot-review-actions'
import { ReservationList } from '@/components/spots/reservation-list'
import { SpotStatusBadge } from '@/components/spots/spot-status-badge'
import { canManageBuilding } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { displayTime, sortSchedules, weekdayName, type DayOfWeek } from '@/lib/schedule'
import { useNow } from '@/lib/use-now'
import { displayName } from '@/lib/users'
import { cn } from '@/lib/utils'
import { buildingSpotQuery, buildingSpotReservationsQuery } from '@/queries/admin-spots'
import { buildingQuery } from '@/queries/buildings'
import { buildingMembersQuery } from '@/queries/members'
import type { AdminSpotDetail, BuildingMember } from '@/types/models'

const tabs = ['upcoming', 'past'] as const

const searchSchema = z.object({
  tab: z.enum(tabs).optional().catch(undefined),
})

// `$buildingId_` keeps this page out of the building page's layout: it's a page of its own
export const Route = createFileRoute('/_authenticated/building/$buildingId_/spots/$spotId')({
  validateSearch: searchSchema,
  beforeLoad: ({ params }) => {
    if (!canManageBuilding(params.buildingId)) throw redirect({ to: '/home' })
  },
  loader: ({ context: { queryClient }, params: { buildingId, spotId } }) =>
    Promise.all([
      queryClient.query({ ...buildingQuery(buildingId), staleTime: 'static' }),
      queryClient.query({ ...buildingSpotQuery(buildingId, spotId), staleTime: 'static' }),
      queryClient.query({
        ...buildingSpotReservationsQuery(buildingId, spotId),
        staleTime: 'static',
      }),
      // For the owner's apartment
      queryClient.query({ ...buildingMembersQuery(buildingId), staleTime: 'static' }),
    ]),
  component: BuildingSpotPage,
})

function BuildingSpotPage() {
  const { t } = useTranslation()
  const { buildingId, spotId } = Route.useParams()
  const { tab = 'upcoming' } = Route.useSearch()
  const now = useNow()
  const { data: building } = useSuspenseQuery(buildingQuery(buildingId))
  const { data: spot } = useSuspenseQuery(buildingSpotQuery(buildingId, spotId))
  const { data: reservations } = useSuspenseQuery(buildingSpotReservationsQuery(buildingId, spotId))
  const { data: members } = useSuspenseQuery(buildingMembersQuery(buildingId))
  const membership = members.find((member) => member.userId === spot.userId)

  // Upcoming includes the booking in progress; past is most recent first
  const byTab = {
    upcoming: reservations.filter((r) => r.end > now),
    past: reservations.filter((r) => r.end <= now).reverse(),
  }
  const shown = byTab[tab]

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-3xl">
      <header className="grid gap-3">
        <Link
          to="/building/$buildingId"
          params={{ buildingId }}
          search={{ tab: 'spots' }}
          className="flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-4" />
          {building.name}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary-50 text-xl font-bold text-primary dark:bg-primary-950">
              {spot.number}
            </span>
            <div className="grid gap-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {t('spots.name', { number: spot.number })}
              </h1>
              <SpotStatusBadge status={spot.status} />
            </div>
          </div>
          <SpotReviewActions buildingId={buildingId} spot={spot} />
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <OwnerCard spot={spot} membership={membership} />
        <DetailsCard spot={spot} />
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold">{t('availability.weekly')}</h2>
        <WeeklyHours spot={spot} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-bold">{t('spotReservations.title')}</h2>
        <nav
          aria-label={t('spotReservations.title')}
          className="grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold"
        >
          {tabs.map((key) => (
            <Link
              key={key}
              from={Route.fullPath}
              search={{ tab: key }}
              replace
              resetScroll={false}
              aria-current={tab === key ? 'page' : undefined}
              className={cn(
                'rounded-full px-3 py-2 text-center text-muted-foreground transition-colors hover:text-foreground',
                tab === key && 'bg-background text-foreground shadow-sm',
              )}
            >
              {t(`spotReservations.tabs.${key}`)} · {byTab[key].length}
            </Link>
          ))}
        </nav>
        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
            <CalendarXIcon className="mb-1 size-6 text-muted-foreground" />
            <p className="font-semibold">{t(`spotReservations.empty.${tab}`)}</p>
          </div>
        ) : (
          <ReservationList reservations={shown} now={now} />
        )}
      </section>
    </div>
  )
}

function OwnerCard({
  spot,
  membership,
}: {
  spot: AdminSpotDetail
  membership: BuildingMember | undefined
}) {
  const { t } = useTranslation()
  const { owner } = spot
  const name = owner && displayName(owner)

  return (
    <section className="grid content-start gap-2 rounded-2xl border bg-card p-4 shadow-xs">
      <h2 className="text-sm font-semibold text-muted-foreground">
        {t('buildings.spotDetail.owner')}
      </h2>
      {owner ? (
        <>
          <p className="truncate text-lg font-bold">{name || owner.email}</p>
          <a
            href={`mailto:${owner.email}`}
            className="flex w-fit max-w-full items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <MailIcon className="size-4 shrink-0" />
            <span className="truncate">{owner.email}</span>
          </a>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t('buildings.spots.unknownOwner')}</p>
      )}
      {membership?.apartment && (
        <p className="flex items-center gap-1.5 text-sm">
          <HomeIcon className="size-4 shrink-0 text-muted-foreground" />
          {t('buildings.spotDetail.apartment', { apartment: membership.apartment })}
        </p>
      )}
    </section>
  )
}

function DetailsCard({ spot }: { spot: AdminSpotDetail }) {
  const { t, i18n } = useTranslation()
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${spot.lat},${spot.long}`)}`

  return (
    <section className="grid content-start gap-2 rounded-2xl border bg-card p-4 shadow-xs">
      <h2 className="text-sm font-semibold text-muted-foreground">
        {t('buildings.spotDetail.details')}
      </h2>
      <p className="whitespace-pre-line">{spot.description || t('find.table.noDetails')}</p>
      <p className="text-sm text-muted-foreground">
        {t('spots.submitted', { date: formatDate(spot.updatedAt, i18n.resolvedLanguage ?? 'en') })}
      </p>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <MapPinIcon className="size-4" />
        {t('buildings.spots.location', { number: spot.number })}
      </a>
    </section>
  )
}

/** The owner's weekly hours, read-only: one row per day, Monday first */
function WeeklyHours({ spot }: { spot: AdminSpotDetail }) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'
  const schedules = sortSchedules(spot.schedules)

  if (schedules.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-dashed px-4 py-4 text-sm text-muted-foreground">
        <CalendarClockIcon className="size-4 shrink-0" />
        {t('buildings.spotDetail.noHours')}
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="border-b bg-muted/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <tr>
            <th scope="col" className="px-4 py-2.5">
              {t('availability.columns.day')}
            </th>
            <th scope="col" className="px-4 py-2.5">
              {t('availability.columns.hours')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {schedules.map((schedule) => (
            <tr key={schedule.id}>
              <th scope="row" className="px-4 py-2.5 font-semibold">
                {weekdayName(schedule.dayOfWeek as DayOfWeek, language, 'long')}
              </th>
              <td className="px-4 py-2.5 tabular-nums">
                {displayTime(schedule.startMinute)} – {displayTime(schedule.endMinute)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
