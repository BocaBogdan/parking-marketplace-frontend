import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftIcon, MailPlusIcon, UsersIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { BulkInviteDialog } from '@/components/buildings/bulk-invite-dialog'
import { BuildingSpotsEmpty, BuildingSpotsTable } from '@/components/buildings/building-spots-table'
import { InviteResidentDialog } from '@/components/buildings/invite-resident-dialog'
import { formatDate } from '@/lib/format'
import { buildingSpotsQuery } from '@/queries/admin-spots'
import { buildingQuery } from '@/queries/buildings'

// `?invite=single` / `?invite=bulk` open the invite dialogs, so they can be linked to.
// (The spot review tabs and document preview are parked until the API has review
// status and documents again: see components/buildings/spot-review-table.tsx.)
const searchSchema = z.object({
  invite: z.enum(['single', 'bulk']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/_admin/building/$buildingId')({
  validateSearch: searchSchema,
  loader: ({ context: { queryClient }, params: { buildingId } }) =>
    Promise.all([
      queryClient.query({ ...buildingQuery(buildingId), staleTime: 'static' }),
      queryClient.query({ ...buildingSpotsQuery(buildingId), staleTime: 'static' }),
    ]),
  component: BuildingPage,
})

function BuildingPage() {
  const { t, i18n } = useTranslation()
  const { buildingId } = Route.useParams()
  const { invite } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: building } = useSuspenseQuery(buildingQuery(buildingId))
  const { data: spots } = useSuspenseQuery(buildingSpotsQuery(buildingId))

  const setInvite = (next: 'single' | 'bulk' | undefined) =>
    void navigate({ search: { invite: next }, replace: true, resetScroll: false })
  const closeOnDismiss = (open: boolean) => !open && setInvite(undefined)

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-4xl">
      <header className="grid gap-3">
        <Link
          to="/buildings"
          className="flex w-fit items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-4" />
          {t('nav.buildings')}
        </Link>
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

      <section className="grid gap-3">
        <h2 className="text-lg font-bold">
          {t('buildings.spots.title')}{' '}
          <span className="font-normal text-muted-foreground">· {spots.length}</span>
        </h2>
        {spots.length === 0 ? (
          <BuildingSpotsEmpty message={t('buildings.spots.empty.ALL')} />
        ) : (
          <BuildingSpotsTable spots={spots} />
        )}
      </section>

      <InviteResidentDialog
        buildingId={building.id}
        buildingName={building.name}
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
