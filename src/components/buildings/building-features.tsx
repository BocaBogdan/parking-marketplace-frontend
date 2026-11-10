import { useId } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { serverErrorMessage } from '@/lib/form'
import { buildingFeatureFlagsQuery, setBuildingFeatureFlag } from '@/queries/feature-flags'
import type { BuildingFeatureFlag } from '@/types/models'

// Flags the app knows how to describe; others show their key and the backend's description
const KNOWN_FLAGS = ['SPOT_DOCUMENT_NOT_REQUIRED'] as const
type KnownFlag = (typeof KNOWN_FLAGS)[number]
const isKnown = (key: string): key is KnownFlag => (KNOWN_FLAGS as readonly string[]).includes(key)

/** The building's feature flags, each switched on or off by an admin */
export function BuildingFeatures({ buildingId }: { buildingId: string }) {
  const { t } = useTranslation()
  const { data: flags, isPending, error } = useQuery(buildingFeatureFlagsQuery(buildingId))

  return (
    <section className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="grid gap-0.5">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t('buildings.features.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('buildings.features.hint')}</p>
      </div>
      {isPending ? (
        <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {serverErrorMessage(error)}
        </p>
      ) : flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('buildings.features.empty')}</p>
      ) : (
        <ul className="grid gap-3">
          {flags.map((flag) => (
            <FeatureToggle key={flag.key} buildingId={buildingId} flag={flag} />
          ))}
        </ul>
      )}
    </section>
  )
}

function FeatureToggle({ buildingId, flag }: { buildingId: string; flag: BuildingFeatureFlag }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const id = useId()
  const label = isKnown(flag.key) ? t(`buildings.features.flags.${flag.key}.label`) : flag.key
  const description = isKnown(flag.key)
    ? t(`buildings.features.flags.${flag.key}.description`)
    : flag.description

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => setBuildingFeatureFlag(buildingId, flag.key, enabled),
    onSuccess: async ({ enabled }) => {
      await queryClient.invalidateQueries({
        queryKey: buildingFeatureFlagsQuery(buildingId).queryKey,
      })
      toast.success(
        t(enabled ? 'buildings.features.toast.on' : 'buildings.features.toast.off', {
          name: label,
        }),
      )
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  // Shows the new state while it saves
  const checked = toggle.isPending ? toggle.variables : flag.enabled

  return (
    <li className="grid gap-1">
      <div className="flex items-center gap-2.5">
        <Checkbox
          id={id}
          checked={checked}
          disabled={toggle.isPending}
          onCheckedChange={(next) => toggle.mutate(next === true)}
          aria-describedby={description ? `${id}-hint` : undefined}
        />
        <Label htmlFor={id} className="font-semibold">
          {label}
        </Label>
        {toggle.isPending && <Loader2Icon className="size-4 animate-spin text-muted-foreground" />}
      </div>
      {description && (
        <p id={`${id}-hint`} className="pl-6.5 text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </li>
  )
}
