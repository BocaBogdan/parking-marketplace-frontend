import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EllipsisIcon, MailXIcon, SendIcon } from 'lucide-react'
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
import { resendInvite, revokeInvite } from '@/queries/members'
import type { BuildingInvite } from '@/types/models'

interface InviteActionsProps {
  invite: BuildingInvite
  /** Building admins manage residents' invitations only */
  isAdmin: boolean
}

/** A pending invitation's menu: send a fresh link, or cancel it */
export function InviteActions({ invite, isAdmin }: InviteActionsProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['buildings', invite.buildingId, 'invites'] }),
      // A resend can add someone who signed up meanwhile
      queryClient.invalidateQueries({ queryKey: ['buildings', invite.buildingId, 'members'] }),
    ])

  const resend = useMutation({
    mutationFn: () => resendInvite(invite.buildingId, invite.id),
    onSuccess: async (resent) => {
      await refresh()
      toast.success(
        t(
          resent.status === 'ACCEPTED'
            ? 'buildings.users.invite.joined'
            : 'buildings.users.invite.resent',
          { email: invite.email },
        ),
      )
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  const revoke = useMutation({
    mutationFn: () => revokeInvite(invite.buildingId, invite.id),
    onSuccess: async () => {
      setConfirming(false)
      await refresh()
      toast.success(t('buildings.users.invite.revoked', { email: invite.email }))
    },
    onError: (error) => toast.error(serverErrorMessage(error)),
  })

  // Mirrors InviteService: only admins touch a building admin's invitation
  if (!isAdmin && invite.role === 'BUILDING_ADMIN') return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={resend.isPending}
            aria-label={t('buildings.users.invite.actions', { email: invite.email })}
          >
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => resend.mutate()}>
            <SendIcon />
            {t('buildings.users.invite.resend')}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <MailXIcon />
            {t('buildings.users.invite.revoke')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('buildings.users.invite.confirmTitle', { email: invite.email })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('buildings.users.invite.confirmBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revoke.isPending}>
              {t('buildings.users.roleChange.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={revoke.isPending}
              onClick={(event) => {
                // Stay open until it's done, so a failure can be retried
                event.preventDefault()
                revoke.mutate()
              }}
            >
              {t('buildings.users.invite.revoke')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
