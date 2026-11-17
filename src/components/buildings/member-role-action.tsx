import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EllipsisIcon, ShieldCheckIcon, ShieldOffIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { serverErrorMessage } from '@/lib/form'
import { displayName } from '@/lib/users'
import { updateMemberRole } from '@/queries/members'
import type { BuildingMember } from '@/types/models'

interface MemberRoleActionProps {
  member: BuildingMember
  buildingName: string
}

/** The admin's row menu on the Users tab: promote to building admin, or back to resident */
export function MemberRoleAction({ member, buildingName }: MemberRoleActionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const promote = member.role === 'RESIDENT'
  const name = displayName(member.user) || member.user.email

  const save = useMutation({
    mutationFn: () =>
      updateMemberRole(member.buildingId, member.id, promote ? 'BUILDING_ADMIN' : 'RESIDENT'),
    onSuccess: async () => {
      setConfirming(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buildings', member.buildingId, 'members'] }),
        // The admin may have changed their own membership
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ])
      toast.success(t('buildings.users.roleChange.saved', { name }))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('buildings.users.roleChange.actions', { name })}
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setConfirming(true)}>
            {promote ? <ShieldCheckIcon /> : <ShieldOffIcon />}
            {t(
              promote
                ? 'buildings.users.roleChange.makeAdmin'
                : 'buildings.users.roleChange.makeResident',
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                promote
                  ? 'buildings.users.roleChange.confirmAdminTitle'
                  : 'buildings.users.roleChange.confirmResidentTitle',
                { name, building: buildingName },
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                promote
                  ? 'buildings.users.roleChange.confirmAdminBody'
                  : 'buildings.users.roleChange.confirmResidentBody',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={save.isPending}>
              {t('buildings.users.roleChange.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={promote ? 'default' : 'destructive'}
              disabled={save.isPending}
              onClick={(event) => {
                // Stay open until it's saved, so a failure can be retried
                event.preventDefault()
                save.mutate()
              }}
            >
              {t('buildings.users.roleChange.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
