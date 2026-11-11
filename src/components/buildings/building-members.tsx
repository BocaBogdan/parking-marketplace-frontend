import type { SortingState } from '@tanstack/react-table'
import { MailIcon, ShieldCheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { BuildingSpotsEmpty } from '@/components/buildings/spot-review-table'
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
}

const col = columnHelper<BuildingMember>()

/** The Users tab: who lives in the building, and who's invited but hasn't signed up */
export function BuildingMembers({
  members,
  invites,
  sorting,
  onSortingChange,
}: BuildingMembersProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'

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
          <ul className="divide-y rounded-2xl border bg-card shadow-xs">
            {invites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <MailIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="grid min-w-0 flex-1">
                  <span className="truncate font-semibold">{invite.email}</span>
                  <span className="text-muted-foreground">
                    {t('buildings.users.invited', {
                      apartment: invite.apartment,
                      date: formatDate(invite.createdAt, language),
                    })}
                  </span>
                </span>
                <RoleBadge role={invite.role} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
