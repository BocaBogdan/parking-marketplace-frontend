import type { SortingState } from '@tanstack/react-table'
import { MailIcon, ShieldCheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { BuildingSpotsEmpty } from '@/components/buildings/spot-review-table'
import { InviteActions } from '@/components/buildings/invite-actions'
import { MemberActions } from '@/components/buildings/member-actions'
import { DataTable } from '@/components/data-table/data-table'
import { columnHelper } from '@/components/data-table/features'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { displayName } from '@/lib/users'
import type { BuildingInvite, BuildingMember, MembershipRole } from '@/types/models'

const roleTone: Record<MembershipRole, string> = {
  BUILDING_ADMIN: 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300',
  RESIDENT: 'bg-muted text-muted-foreground',
}

function RoleBadge({ role }: { role: MembershipRole }) {
  const { t } = useTranslation()

  return (
    <Badge className={cn('font-bold tracking-wide uppercase', roleTone[role])}>
      {role === 'BUILDING_ADMIN' && <ShieldCheckIcon />}
      {t(`buildings.users.role.${role}`)}
    </Badge>
  )
}

interface BuildingMembersProps {
  members: BuildingMember[]
  invites: BuildingInvite[]
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  /** Admins change roles and remove anyone; building admins remove residents */
  isAdmin: boolean
  currentUserId: string | undefined
  buildingName: string
}

const col = columnHelper<BuildingMember>()
const inviteCol = columnHelper<BuildingInvite>()

/** Clerk no longer accepts the link; the admin can resend it */
const isExpired = (expiresAt: string) => new Date(expiresAt).getTime() <= Date.now()

/** The Users tab: who lives in the building, and who's invited but hasn't signed up */
export function BuildingMembers({
  members,
  invites,
  sorting,
  onSortingChange,
  isAdmin,
  currentUserId,
  buildingName,
}: BuildingMembersProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'

  const inviteColumns = inviteCol.columns([
    inviteCol.accessor('email', {
      header: t('buildings.users.columns.email'),
      meta: { rowHeader: true },
      cell: ({ getValue }) => (
        <span className="inline-flex items-center gap-2 font-semibold">
          <MailIcon className="size-4 shrink-0 text-muted-foreground" />
          {getValue()}
        </span>
      ),
    }),
    inviteCol.accessor((invite) => invite.apartment || undefined, {
      id: 'apartment',
      header: t('buildings.users.columns.apartment'),
      cell: ({ getValue }) => getValue() ?? '—',
    }),
    inviteCol.accessor((invite) => t(`buildings.users.role.${invite.role}`), {
      id: 'role',
      header: t('buildings.users.columns.role'),
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    }),
    inviteCol.accessor('createdAt', {
      header: t('buildings.users.columns.sent'),
      meta: { cellClassName: 'whitespace-nowrap text-muted-foreground tabular-nums' },
      cell: ({ getValue }) => formatDate(getValue(), language),
    }),
    // Invites without a link (none sent) sort last
    inviteCol.accessor((invite) => invite.expiresAt ?? undefined, {
      id: 'expires',
      header: t('buildings.users.columns.expires'),
      meta: { cellClassName: 'whitespace-nowrap tabular-nums' },
      cell: ({ getValue }) => {
        const expiresAt = getValue()
        if (!expiresAt) return '—'
        return isExpired(expiresAt) ? (
          <Badge variant="destructive">{t('buildings.users.expired')}</Badge>
        ) : (
          <span className="text-muted-foreground">{formatDate(expiresAt, language)}</span>
        )
      },
    }),
    inviteCol.display({
      id: 'actions',
      header: t('buildings.users.columns.actions'),
      meta: { srOnlyHeader: true, align: 'right' },
      cell: ({ row }) => <InviteActions invite={row.original} isAdmin={isAdmin} />,
    }),
  ])

  const columns = col.columns([
    col.accessor((member) => displayName(member.user) || member.user.email, {
      id: 'name',
      header: t('buildings.users.columns.name'),
      meta: { rowHeader: true },
      cell: ({ row: { original: member } }) => (
        <span className="grid">
          <span className="font-semibold">{displayName(member.user) || member.user.email}</span>
          {displayName(member.user) && (
            <span className="text-muted-foreground">{member.user.email}</span>
          )}
        </span>
      ),
    }),
    // No apartment sorts last
    col.accessor((member) => member.apartment || undefined, {
      id: 'apartment',
      header: t('buildings.users.columns.apartment'),
      cell: ({ getValue }) => getValue() ?? '—',
    }),
    col.accessor((member) => t(`buildings.users.role.${member.role}`), {
      id: 'role',
      header: t('buildings.users.columns.role'),
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    }),
    col.accessor('createdAt', {
      header: t('buildings.users.columns.joined'),
      meta: { cellClassName: 'whitespace-nowrap text-muted-foreground tabular-nums' },
      cell: ({ getValue }) => formatDate(getValue(), language),
    }),
    // Everyone here manages the building; the menu shows what each may do to the member
    col.display({
      id: 'actions',
      header: t('buildings.users.columns.actions'),
      meta: { srOnlyHeader: true, align: 'right' },
      cell: ({ row }) => (
        <MemberActions
          member={row.original}
          buildingName={buildingName}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
      ),
    }),
  ])

  return (
    <div className="grid gap-5">
      {members.length === 0 ? (
        <BuildingSpotsEmpty message={t('buildings.users.empty')} />
      ) : (
        <DataTable
          data={members}
          columns={columns}
          getRowId={(member) => member.id}
          sorting={sorting}
          onSortingChange={onSortingChange}
          className="min-w-2xl"
        />
      )}

      {invites.length > 0 && (
        <section className="grid gap-3">
          <h3 className="font-bold">
            {t('buildings.users.pending')}{' '}
            <span className="font-normal text-muted-foreground">· {invites.length}</span>
          </h3>
          <DataTable
            data={invites}
            columns={inviteColumns}
            getRowId={(invite) => invite.id}
            className="min-w-2xl"
          />
        </section>
      )}
    </div>
  )
}
