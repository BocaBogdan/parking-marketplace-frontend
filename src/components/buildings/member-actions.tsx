import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EllipsisIcon, ShieldCheckIcon, ShieldOffIcon, UserMinusIcon } from 'lucide-react'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { serverErrorMessage } from '@/lib/form'
import { displayName } from '@/lib/users'
import { removeMember, updateMemberRole } from '@/queries/members'
import type { BuildingMember } from '@/types/models'

interface MemberActionsProps {
  member: BuildingMember
  buildingName: string
  /** Admins change roles and remove anyone; building admins only remove residents */
  isAdmin: boolean
  currentUserId: string | undefined
}

/** The row menu on the Users tab: change the member's role, or remove them from the building */
export function MemberActions({
  member,
  buildingName,
  isAdmin,
  currentUserId,
}: MemberActionsProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState<'role' | 'remove'>()
  const promote = member.role === 'RESIDENT'
  const name = displayName(member.user) || member.user.email
  // Mirrors MemberService.remove
  const canRemove = isAdmin || (member.role === 'RESIDENT' && member.userId !== currentUserId)

  const saveRole = useMutation({
    mutationFn: () =>
      updateMemberRole(member.buildingId, member.id, promote ? 'BUILDING_ADMIN' : 'RESIDENT'),
    onSuccess: async () => {
      setConfirming(undefined)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buildings', member.buildingId, 'members'] }),
        // The admin may have changed their own membership
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ])
      toast.success(t('buildings.users.roleChange.saved', { name }))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  const remove = useMutation({
    mutationFn: () => removeMember(member.buildingId, member.id),
    onSuccess: async (removal) => {
      setConfirming(undefined)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['buildings', member.buildingId, 'members'] }),
        queryClient.invalidateQueries({ queryKey: ['buildings', member.buildingId, 'spots'] }),
        // An admin may have removed themselves
        queryClient.invalidateQueries({ queryKey: ['me'] }),
      ])
      toast.success(t('buildings.users.remove.saved', { name }), {
        description: [
          removal.spotsDeleted > 0 &&
            t('buildings.users.remove.spotsDeleted', { count: removal.spotsDeleted }),
          removal.spotsKept > 0 &&
            t('buildings.users.remove.spotsKept', { count: removal.spotsKept }),
          removal.bookingsCancelled > 0 &&
            t('buildings.users.remove.bookingsCancelled', { count: removal.bookingsCancelled }),
        ]
          .filter(Boolean)
          .join(' '),
      })
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  if (!isAdmin && !canRemove) return null
  const pending = saveRole.isPending || remove.isPending

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
          {isAdmin && (
            <DropdownMenuItem onSelect={() => setConfirming('role')}>
              {promote ? <ShieldCheckIcon /> : <ShieldOffIcon />}
              {t(
                promote
                  ? 'buildings.users.roleChange.makeAdmin'
                  : 'buildings.users.roleChange.makeResident',
              )}
            </DropdownMenuItem>
          )}
          {isAdmin && canRemove && <DropdownMenuSeparator />}
          {canRemove && (
            <DropdownMenuItem variant="destructive" onSelect={() => setConfirming('remove')}>
              <UserMinusIcon />
              {t('buildings.users.remove.action')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={Boolean(confirming)}
        onOpenChange={(open) => !open && setConfirming(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming === 'remove'
                ? t('buildings.users.remove.confirmTitle', { name, building: buildingName })
                : t(
                    promote
                      ? 'buildings.users.roleChange.confirmAdminTitle'
                      : 'buildings.users.roleChange.confirmResidentTitle',
                    { name, building: buildingName },
                  )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming === 'remove'
                ? t('buildings.users.remove.confirmBody')
                : t(
                    promote
                      ? 'buildings.users.roleChange.confirmAdminBody'
                      : 'buildings.users.roleChange.confirmResidentBody',
                  )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>
              {t('buildings.users.roleChange.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={confirming === 'role' && promote ? 'default' : 'destructive'}
              disabled={pending}
              onClick={(event) => {
                // Stay open until it's saved, so a failure can be retried
                event.preventDefault()
                if (confirming === 'remove') remove.mutate()
                else saveRole.mutate()
              }}
            >
              {confirming === 'remove'
                ? t('buildings.users.remove.confirm')
                : t('buildings.users.roleChange.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
