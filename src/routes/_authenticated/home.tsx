import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { ArrowRightIcon, CircleCheckIcon, MapPinPlusIcon, PlusIcon, SearchIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActionCard } from '@/components/home/action-card'
import { GreetingCard } from '@/components/home/greeting-card'
import { StatTiles } from '@/components/home/stat-tiles'
import { TipCard } from '@/components/home/tip-card'
import { UpcomingActivity } from '@/components/home/upcoming-activity'
import { useComingSoon } from '@/lib/coming-soon'
import { useNow } from '@/lib/use-now'
import { myCarsQuery } from '@/queries/cars'
import { myReservationsQuery, upcomingReservations } from '@/queries/reservations'
import { currentSlotAvailabilityQuery, mySpotsQuery } from '@/queries/spots'
import { currentUserQuery } from '@/queries/users'

export const Route = createFileRoute('/_authenticated/home')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(mySpotsQuery),
      queryClient.ensureQueryData(myCarsQuery),
      queryClient.ensureQueryData(myReservationsQuery),
      queryClient.ensureQueryData(currentSlotAvailabilityQuery(Date.now())),
    ]),
  component: HomePage,
})

function HomePage() {
  const { t } = useTranslation()
  const comingSoon = useComingSoon()
  const navigate = Route.useNavigate()
  const now = useNow()
  const { data: user } = useSuspenseQuery(currentUserQuery())
  const { data: spots } = useSuspenseQuery(mySpotsQuery)
  const { data: cars } = useSuspenseQuery(myCarsQuery)
  const { data: reservations } = useSuspenseQuery(myReservationsQuery)
  // Not suspense: the key moves every 30-minute slot, and we'd rather keep the old count
  // on screen while the new slot loads than flash the pending state
  const { data: availableSpots = [] } = useQuery({
    ...currentSlotAvailabilityQuery(now),
    placeholderData: keepPreviousData,
  })

  const upcoming = upcomingReservations(reservations, now)
  const mySpotIds = new Set(spots.map((spot) => spot.id))
  const neighbourSpotsFree = availableSpots.filter((spot) => !mySpotIds.has(spot.id)).length

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-3xl md:grid-cols-2">
      <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
        <GreetingCard user={user} />
        <StatTiles spots={spots.length} cars={cars.length} active={upcoming.length} />
      </div>

      <ActionCard
        tone="secondary"
        icon={MapPinPlusIcon}
        title={t('home.registerSpot.title')}
        badge={t('home.registerSpot.badge')}
        description={t('home.registerSpot.description')}
        action={
          <>
            <PlusIcon />
            {t('home.registerSpot.action')}
          </>
        }
        onAction={() => void navigate({ to: '/spots', search: { spot: 'new' } })}
        footer={
          <>
            <CircleCheckIcon className="size-3.5 text-secondary" />
            {spots.length > 0
              ? t('home.registerSpot.count', { count: spots.length })
              : t('home.registerSpot.none')}
          </>
        }
      />

      <ActionCard
        tone="primary"
        icon={SearchIcon}
        title={t('home.findSpot.title')}
        badge={t('home.findSpot.badge')}
        description={t('home.findSpot.description')}
        action={
          <>
            {t('home.findSpot.action')}
            <ArrowRightIcon />
          </>
        }
        onAction={() => comingSoon(t('home.findSpot.title'))}
        footer={
          <>
            <span className="size-2 rounded-full bg-secondary" />
            {t('home.findSpot.available', { count: neighbourSpotsFree })}
          </>
        }
      />

      <div className="md:col-span-2">
        <UpcomingActivity reservation={upcoming[0]} cars={cars} now={now} />
      </div>

      <div className="md:col-span-2">
        <TipCard />
      </div>
    </div>
  )
}
