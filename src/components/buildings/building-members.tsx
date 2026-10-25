import { MailIcon, ShieldCheckIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { BuildingSpotsEmpty } from '@/components/buildings/spot-review-table'
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
}

/** The Users tab: who lives in the building, and who's invited but hasn't signed up */
export function BuildingMembers({ members, invites }: BuildingMembersProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'en'

  return (
    <div className="grid gap-5">
      {members.length === 0 ? (
        <BuildingSpotsEmpty message={t('buildings.users.empty')} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border bg-card shadow-xs">
          <table className="w-full min-w-2xl text-left text-sm">
            <thead className="border-b bg-muted/60 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t('buildings.users.columns.name')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('buildings.users.columns.apartment')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('buildings.users.columns.eBloc')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('buildings.users.columns.role')}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('buildings.users.columns.joined')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {members.map((member) => (
                <tr key={member.id} className="align-middle">
                  <th scope="row" className="px-4 py-3 font-normal">
                    <span className="grid">
                      <span className="font-semibold">
                        {displayName(member.user) || member.user.email}
                      </span>
                      {displayName(member.user) && (
                        <span className="text-muted-foreground">{member.user.email}</span>
                      )}
                    </span>
                  </th>
                  <td className="px-4 py-3">{member.apartment || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {member.eBlocUserID || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatDate(member.createdAt, language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
