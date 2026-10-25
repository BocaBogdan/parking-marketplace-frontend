import { lazy, Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { ArrowLeftIcon, Loader2Icon, MailPlusIcon, UsersIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { BuildingMembers } from '@/components/buildings/building-members'
import { BulkInviteDialog } from '@/components/buildings/bulk-invite-dialog'
import { InviteResidentDialog } from '@/components/buildings/invite-resident-dialog'
import { SpotDocumentDialog } from '@/components/buildings/spot-document-dialog'
import { BuildingSpotsEmpty, SpotReviewTable } from '@/components/buildings/spot-review-table'
import { canManageBuilding, useIsAdmin } from '@/lib/auth'
import { formatDate } from '@/lib/format'
import { STATS_RANGES } from '@/lib/stats'
import { cn } from '@/lib/utils'
import { buildingSpotsQuery } from '@/queries/admin-spots'
import { buildingQuery } from '@/queries/buildings'
import { buildingMembersQuery, pendingInvitesQuery } from '@/queries/members'

const sections = ['spots', 'users', 'stats'] as const

// Charts are the heaviest code on the page: load them only when the tab opens
const BuildingStats = lazy(() => import('@/components/stats/building-stats'))

// Pending first: reviewing new spots is what the admin comes here for
const statusTabs = ['PENDING', 'CONFIRMED', 'REJECTED', 'ALL'] as const

// `?invite=single` / `?invite=bulk` open the invite dialogs and `?document=<spotId>` a spot's
// proof, so they can be linked to; `?tab=` picks Spots, Users or Statistics, `?status=` the
// review tab and `?range=` the statistics period
const searchSchema = z.object({
  tab: z.enum(sections).optional().catch(undefined),
  status: z.enum(statusTabs).optional().catch(undefined),
  invite: z.enum(['single', 'bulk']).optional().catch(undefined),
  document: z.uuid().optional().catch(undefined),
  range: z.enum(STATS_RANGES).optional().catch(undefined),
})

// Not under _admin: a building admin opens their own building here too
export const Route = createFileRoute('/_authenticated/building/$buildingId')({
  validateSearch: searchSchema,
  beforeLoad: ({ params }) => {
    if (!canManageBuilding(params.buildingId)) throw redirect({ to: '/home' })
  },
  loader: ({ context: { queryClient }, params: { buildingId } }) =>
    Promise.all([
      queryClient.query({ ...buildingQuery(buildingId), staleTime: 'static' }),
      queryClient.query({ ...buildingSpotsQuery(buildingId), staleTime: 'static' }),
      queryClient.query({ ...buildingMembersQuery(buildingId), staleTime: 'static' }),
      queryClient.query({ ...pendingInvitesQuery(buildingId), staleTime: 'static' }),
    ]),
  component: BuildingPage,
})

function BuildingPage() {
  const { t, i18n } = useTranslation()
  const { buildingId } = Route.useParams()
  const { tab = 'spots', status = 'PENDING', invite, document, range = '30d' } = Route.useSearch()
  const navigate = Route.useNavigate()
  const isAdmin = useIsAdmin()
  const { data: building } = useSuspenseQuery(buildingQuery(buildingId))
  const { data: spots } = useSuspenseQuery(buildingSpotsQuery(buildingId))
  const { data: members } = useSuspenseQuery(buildingMembersQuery(buildingId))
  const { data: invites } = useSuspenseQuery(pendingInvitesQuery(buildingId))

  const countOf = (tab: (typeof statusTabs)[number]) =>
    tab === 'ALL' ? spots.length : spots.filter((spot) => spot.status === tab).length
  const shown = status === 'ALL' ? spots : spots.filter((spot) => spot.status === status)
  const viewing = spots.find((spot) => spot.id === document)

  const setSearch = (next: { invite?: 'single' | 'bulk'; document?: string }) =>
    void navigate({ search: { tab, status, range, ...next }, replace: true, resetScroll: false })
  const setInvite = (next: 'single' | 'bulk' | undefined) => setSearch({ invite: next })
  const closeOnDismiss = (open: boolean) => !open && setInvite(undefined)

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-4xl">
      <header className="grid gap-3">
        {isAdmin && (
          <Link
            to="/buildings"
            className="flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeftIcon className="size-4" />
            {t('nav.buildings')}
          </Link>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{building.name}</h1>
            <p className="text-sm text-muted-foreground">
              {t('buildings.detail.added', {
                date: formatDate(building.createdAt, i18n.resolvedLanguage ?? 'en'),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              className="h-11 rounded-full px-4"
              onClick={() => setInvite('single')}
            >
              <MailPlusIcon />
              {t('buildings.invite.single.action')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 rounded-full px-4"
              onClick={() => setInvite('bulk')}
            >
              <UsersIcon />
              {t('buildings.invite.bulk.action')}
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-1 rounded-2xl border bg-card p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t('buildings.detail.description')}
        </h2>
        <p className="whitespace-pre-line">{building.description}</p>
      </section>

      <nav aria-label={building.name} className="flex gap-6 border-b text-sm font-semibold">
        {sections.map((key) => (
          <Link
            key={key}
            from={Route.fullPath}
            search={{ tab: key }}
            replace
            resetScroll={false}
            aria-current={tab === key ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 border-transparent pb-2.5 text-muted-foreground transition-colors hover:text-foreground',
              tab === key && 'border-primary text-foreground',
            )}
          >
            {key === 'stats'
              ? t('stats.title')
              : `${t(`buildings.${key}.title`)} · ${key === 'spots' ? spots.length : members.length}`}
          </Link>
        ))}
      </nav>

      <section className="grid gap-3">
        {tab === 'spots' ? (
          <>
            <nav
              aria-label={t('buildings.spots.title')}
              className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1 text-sm font-semibold sm:grid-cols-4 sm:rounded-full"
            >
              {statusTabs.map((key) => (
                <Link
                  key={key}
                  from={Route.fullPath}
                  search={{ tab: 'spots', status: key }}
                  replace
                  resetScroll={false}
                  aria-current={status === key ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-2 py-2 text-center text-muted-foreground transition-colors hover:text-foreground',
                    status === key && 'bg-background text-foreground shadow-sm',
                  )}
                >
                  {key === 'ALL' ? t('buildings.spots.all') : t(`spots.status.${key}`)} ·{' '}
                  {countOf(key)}
                </Link>
              ))}
            </nav>
            {shown.length === 0 ? (
              <BuildingSpotsEmpty message={t(`buildings.spots.empty.${status}`)} />
            ) : (
              <SpotReviewTable
                buildingId={building.id}
                spots={shown}
                onViewDocument={(spot) => setSearch({ document: spot.id })}
              />
            )}
          </>
        ) : tab === 'users' ? (
          <BuildingMembers members={members} invites={invites} />
        ) : (
          <Suspense
            fallback={
              <div className="flex justify-center py-16">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <BuildingStats
              buildingId={building.id}
              range={range}
              onRangeChange={(next) =>
                void navigate({
                  search: { tab: 'stats', range: next },
                  replace: true,
                  resetScroll: false,
                })
              }
            />
          </Suspense>
        )}
      </section>

      <SpotDocumentDialog spot={viewing} onOpenChange={(open) => !open && setSearch({})} />

      <InviteResidentDialog
        buildingId={building.id}
        buildingName={building.name}
        canInviteBuildingAdmin={isAdmin}
        open={invite === 'single'}
        onOpenChange={closeOnDismiss}
      />
      <BulkInviteDialog
        buildingId={building.id}
        buildingName={building.name}
        open={invite === 'bulk'}
        onOpenChange={closeOnDismiss}
      />
    </div>
  )
}
