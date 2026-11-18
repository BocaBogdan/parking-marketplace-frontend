import { useId, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { serverErrorMessage } from '@/lib/form'
import { updateBuilding } from '@/queries/buildings'
import type { Building } from '@/types/models'

// Mirrors INVITE_EXPIRY_DAYS in the backend's UpdateBuildingDto
const MIN_DAYS = 1
const MAX_DAYS = 365

/** How long the building's invitation links stay valid; admins only */
export function BuildingInviteSettings({ building }: { building: Building }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const id = useId()
  const [days, setDays] = useState(String(building.inviteExpiryDays))
  const value = Number(days)
  const valid = Number.isInteger(value) && value >= MIN_DAYS && value <= MAX_DAYS

  const save = useMutation({
    mutationFn: () => updateBuilding(building.id, { inviteExpiryDays: value }),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['buildings'] })
      toast.success(t('buildings.inviteSettings.saved', { count: saved.inviteExpiryDays }))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  return (
    <section className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="grid gap-0.5">
        <h2 className="text-sm font-semibold text-muted-foreground">
          {t('buildings.inviteSettings.title')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('buildings.inviteSettings.hint')}</p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) save.mutate()
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor={id} className="font-semibold">
            {t('buildings.inviteSettings.label')}
          </Label>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={MIN_DAYS}
            max={MAX_DAYS}
            step={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            aria-invalid={!valid}
            aria-describedby={valid ? undefined : `${id}-error`}
            className="h-10 w-28"
          />
        </div>
        <Button
          type="submit"
          className="h-10"
          disabled={!valid || value === building.inviteExpiryDays || save.isPending}
        >
          {save.isPending && <Loader2Icon className="animate-spin" />}
          {t('buildings.inviteSettings.save')}
        </Button>
        {!valid && (
          <p id={`${id}-error`} role="alert" className="w-full text-sm text-destructive">
            {t('buildings.inviteSettings.invalid', { min: MIN_DAYS, max: MAX_DAYS })}
          </p>
        )}
      </form>
    </section>
  )
}
