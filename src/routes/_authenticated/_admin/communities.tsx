import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Building2Icon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UsersRoundIcon,
  XIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CommunityFormDialog } from '@/components/communities/community-form-dialog'
import { serverErrorMessage } from '@/lib/form'
import { buildingsQuery } from '@/queries/buildings'
import {
  addCommunityBuilding,
  communitiesQuery,
  deleteCommunity,
  removeCommunityBuilding,
} from '@/queries/communities'
import type { Building, Community } from '@/types/models'

// `?community=new` opens the create dialog, `?community=<id>` renames that one
const searchSchema = z.object({
  community: z
    .union([z.literal('new'), z.uuid()])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/_authenticated/_admin/communities')({
  validateSearch: searchSchema,
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.query({ ...communitiesQuery, staleTime: 'static' }),
      queryClient.query({ ...buildingsQuery, staleTime: 'static' }),
    ]),
  component: CommunitiesPage,
})

/** What the confirmation dialog is asking about */
type Pending =
  | { kind: 'removeBuilding'; community: Community; building: Community['buildings'][number] }
  | { kind: 'delete'; community: Community }

function CommunitiesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { community: dialog } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: communities } = useSuspenseQuery(communitiesQuery)
  const { data: buildings } = useSuspenseQuery(buildingsQuery)
  const [pending, setPending] = useState<Pending>()

  const freeBuildings = buildings.filter((building) => !building.communityId)
  const renaming = communities.find((community) => community.id === dialog)
  const setDialog = (community: string | undefined) =>
    void navigate({ search: { community }, replace: true, resetScroll: false })

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['communities'] }),
      queryClient.invalidateQueries({ queryKey: ['buildings'] }),
    ])

  const add = useMutation({
    mutationFn: ({ community, building }: { community: Community; building: Building }) =>
      addCommunityBuilding(community.id, building.id),
    onSuccess: async (_, { community, building }) => {
      await refresh()
      toast.success(
        t('communities.toast.added', { building: building.name, community: community.name }),
      )
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  const confirm = useMutation({
    mutationFn: (action: Pending) =>
      action.kind === 'delete'
        ? deleteCommunity(action.community.id)
        : removeCommunityBuilding(action.community.id, action.building.id),
    onSuccess: async (_, action) => {
      setPending(undefined)
      await refresh()
      toast.success(
        action.kind === 'delete'
          ? t('communities.toast.deleted', { name: action.community.name })
          : t('communities.toast.removed', {
              building: action.building.name,
              community: action.community.name,
            }),
      )
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('communities.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('communities.subtitle')}</p>
        </div>
        <Button size="lg" className="h-11 rounded-full px-4" onClick={() => setDialog('new')}>
          <PlusIcon />
          {t('communities.create')}
        </Button>
      </header>

      {communities.length === 0 ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary dark:bg-primary-950">
            <UsersRoundIcon className="size-6" />
          </div>
          <h2 className="font-semibold">{t('communities.empty.title')}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t('communities.empty.description')}
          </p>
        </section>
      ) : (
        <ul className="grid gap-4">
          {communities.map((community) => (
            <li key={community.id} className="overflow-hidden rounded-2xl border bg-card shadow-xs">
              <div className="flex items-center gap-3 border-b p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-950">
                  <UsersRoundIcon className="size-5" />
                </span>
                <span className="grid min-w-0 flex-1">
                  <span className="truncate font-semibold">{community.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {t('buildings.count', { count: community.buildings.length })}
                  </span>
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('communities.actions', { name: community.name })}
                    >
                      <EllipsisIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setDialog(community.id)}>
                      <PencilIcon />
                      {t('communities.rename')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setPending({ kind: 'delete', community })}
                    >
                      <Trash2Icon />
                      {t('communities.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <ul className="divide-y">
                {community.buildings.map((building) => (
                  <li key={building.id} className="flex items-center gap-3 px-4 py-2">
                    <Building2Icon className="size-4 shrink-0 text-muted-foreground" />
                    <Link
                      to="/building/$buildingId"
                      params={{ buildingId: building.id }}
                      className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                    >
                      {building.name}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t('communities.removeBuilding', { name: building.name })}
                      onClick={() => setPending({ kind: 'removeBuilding', community, building })}
                    >
                      <XIcon />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="border-t p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={add.isPending}>
                      <PlusIcon />
                      {t('communities.addBuilding')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                    <DropdownMenuLabel>{t('communities.freeBuildings')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {freeBuildings.length === 0 ? (
                      <DropdownMenuItem disabled>
                        {t('communities.form.noFreeBuildings')}
                      </DropdownMenuItem>
                    ) : (
                      freeBuildings.map((building) => (
                        <DropdownMenuItem
                          key={building.id}
                          onSelect={() => add.mutate({ community, building })}
                        >
                          <Building2Icon />
                          {building.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CommunityFormDialog
        open={dialog === 'new' || Boolean(renaming)}
        onOpenChange={(open) => !open && setDialog(undefined)}
        community={renaming}
        freeBuildings={freeBuildings}
      />

      <AlertDialog open={Boolean(pending)} onOpenChange={(open) => !open && setPending(undefined)}>
        <AlertDialogContent>
          {pending && (
            <AlertDialogHeader>
              <AlertDialogTitle>
                {pending.kind === 'delete'
                  ? t('communities.confirmDelete.title', { name: pending.community.name })
                  : t('communities.confirmRemove.title', {
                      building: pending.building.name,
                      community: pending.community.name,
                    })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {pending.kind === 'delete'
                  ? t('communities.confirmDelete.body')
                  : pending.community.buildings.length <= 2
                    ? t('communities.confirmRemove.bodyLast')
                    : t('communities.confirmRemove.body')}
              </AlertDialogDescription>
            </AlertDialogHeader>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirm.isPending}>
              {t('communities.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirm.isPending}
              onClick={(event) => {
                // Stay open until it's saved, so a failure can be retried
                event.preventDefault()
                if (pending) confirm.mutate(pending)
              }}
            >
              {pending?.kind === 'delete' ? t('communities.delete') : t('communities.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
