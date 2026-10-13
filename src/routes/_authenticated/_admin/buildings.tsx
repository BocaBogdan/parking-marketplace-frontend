import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Building2Icon, ChevronRightIcon, PlusIcon, SearchIcon, SearchXIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BuildingFormDialog } from '@/components/buildings/building-form-dialog'
import { buildingsQuery } from '@/queries/buildings'
import type { Building } from '@/types/models'

// The search lives in the URL so a filtered list can be shared or reloaded, and
// `?building=new` opens the create dialog so it can be linked to
const searchSchema = z.object({
  q: z.string().optional().catch(undefined),
  building: z.literal('new').optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/_admin/buildings')({
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.query({ ...buildingsQuery, staleTime: 'static' }),
  component: BuildingsPage,
})

/** Lower-cased and without diacritics, so "brasov" finds "Brașov" */
function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function matches(building: Building, query: string) {
  const needle = normalize(query.trim())
  return normalize(`${building.name} ${building.description}`).includes(needle)
}

function BuildingsPage() {
  const { t } = useTranslation()
  const { q = '', building: dialog } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: buildings } = useSuspenseQuery(buildingsQuery)

  const shown = buildings.filter((building) => matches(building, q))
  const setDialog = (building: 'new' | undefined) =>
    void navigate({
      search: (prev) => ({ ...prev, building }),
      replace: true,
      resetScroll: false,
    })

  return (
    <div className="mx-auto grid max-w-md gap-5 md:max-w-2xl">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('buildings.title')}</h1>
          {buildings.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {t('buildings.count', { count: buildings.length })}
            </p>
          )}
        </div>
        <Button size="lg" className="h-11 rounded-full px-4" onClick={() => setDialog('new')}>
          <PlusIcon />
          {t('buildings.create')}
        </Button>
      </header>

      {buildings.length === 0 ? (
        <section className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary-50 text-primary dark:bg-primary-950">
            <Building2Icon className="size-6" />
          </div>
          <h2 className="font-semibold">{t('buildings.empty.title')}</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t('buildings.empty.description')}
          </p>
        </section>
      ) : (
        <>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={q}
              onChange={(e) =>
                void navigate({
                  search: { q: e.target.value || undefined },
                  replace: true,
                  resetScroll: false,
                })
              }
              aria-label={t('buildings.search')}
              placeholder={t('buildings.searchPlaceholder')}
              className="h-11 border-transparent bg-primary-50 pl-10 dark:bg-input/30"
            />
          </div>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center">
              <SearchXIcon className="mb-1 size-6 text-muted-foreground" />
              <p className="font-semibold">{t('buildings.noMatches', { query: q.trim() })}</p>
            </div>
          ) : (
            <ul className="divide-y overflow-hidden rounded-2xl border bg-card shadow-xs">
              {shown.map((building) => (
                <li key={building.id}>
                  <Link
                    to="/building/$buildingId"
                    params={{ buildingId: building.id }}
                    className="flex items-center gap-3 p-4 transition-colors outline-none hover:bg-muted focus-visible:bg-muted"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-950">
                      <Building2Icon className="size-5" />
                    </span>
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate font-semibold">{building.name}</span>
                      <span className="truncate text-sm text-muted-foreground">
                        {building.description}
                      </span>
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <BuildingFormDialog
        open={dialog === 'new'}
        onOpenChange={(open) => !open && setDialog(undefined)}
      />
    </div>
  )
}
