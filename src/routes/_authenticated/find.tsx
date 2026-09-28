import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ReserveDialog } from '@/components/find/reserve-dialog'
import { ResultsTable } from '@/components/find/results-table'
import { WindowFilter } from '@/components/find/window-filter'
import { resolveWindow, toSearch } from '@/lib/booking-window'
import { toZonedIso } from '@/lib/format'
import { useNow } from '@/lib/use-now'
import { myCarsQuery } from '@/queries/cars'
import { availableSpotsQuery, mySpotsQuery } from '@/queries/spots'

// The window is in the URL so a search can be shared or reloaded. Stale or invalid
// values (e.g. yesterday's link) fall back to defaults in resolveWindow.
const searchSchema = z.object({
  from: z.string().optional().catch(undefined),
  to: z.string().optional().catch(undefined),
  toNextDay: z.boolean().optional().catch(undefined),
  reserve: z.uuid().optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/find')({
  validateSearch: searchSchema,
  loaderDeps: ({ search: { from, to, toNextDay } }) => ({ from, to, toNextDay }),
  loader: ({ context: { queryClient }, deps }) => {
    const window = resolveWindow(deps, Date.now())
    return Promise.all([
      queryClient.ensureQueryData(mySpotsQuery),
      queryClient.ensureQueryData(myCarsQuery),
      queryClient.ensureQueryData(
        availableSpotsQuery(toZonedIso(window.start), toZonedIso(window.end)),
      ),
    ])
  },
  component: FindSpotPage,
})

function FindSpotPage() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const now = useNow()
  const window = resolveWindow(search, now)

  const { data: mySpots } = useSuspenseQuery(mySpotsQuery)
  // Not suspense: keep the previous results on screen while a new window loads
  const { data: available = [], isFetching } = useQuery({
    ...availableSpotsQuery(toZonedIso(window.start), toZonedIso(window.end)),
    placeholderData: keepPreviousData,
  })

  // The backend lists the user's own spots too, but they can't reserve those
  const mySpotIds = new Set(mySpots.map((spot) => spot.id))
  const spots = available.filter((spot) => !mySpotIds.has(spot.id))
  const reserving = spots.find((spot) => spot.id === search.reserve)

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-3xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('find.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('find.description')}</p>
      </header>

      <WindowFilter
        window={window}
        now={now}
        onChange={(next) =>
          void navigate({ search: toSearch(next), replace: true, resetScroll: false })
        }
      />

      <section className="grid gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          {t('find.results', { count: spots.length })}
          {isFetching && <Loader2Icon className="size-4 animate-spin text-muted-foreground" />}
        </h2>
        <ResultsTable
          spots={spots}
          onReserve={(spot) =>
            void navigate({
              search: (prev) => ({ ...prev, reserve: spot.id }),
              replace: true,
              resetScroll: false,
            })
          }
        />
      </section>

      <ReserveDialog
        spot={reserving}
        window={window}
        onOpenChange={(open) =>
          !open &&
          void navigate({
            search: (prev) => ({ ...prev, reserve: undefined }),
            replace: true,
            resetScroll: false,
          })
        }
      />
    </div>
  )
}
