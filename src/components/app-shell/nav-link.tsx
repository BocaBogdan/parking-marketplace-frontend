import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useIsAdmin, useManagedBuildingId } from '@/lib/auth'
import { navItems } from '@/components/app-shell/nav-items'

type Variant = 'tab' | 'inline'

const styles: Record<Variant, { base: string; active: string }> = {
  // Bottom tab bar on mobile: icon above label
  tab: {
    base: 'flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-muted-foreground text-center',
    active: 'text-primary [&_svg]:fill-primary/15',
  },
  // Header links on wider screens
  inline: {
    base: 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
    active: 'bg-primary-50 text-primary hover:bg-primary-50 hover:text-primary dark:bg-primary-950',
  },
}

export function NavLinks({ variant }: { variant: Variant }) {
  const { t } = useTranslation()
  const isAdmin = useIsAdmin()
  const managedBuildingId = useManagedBuildingId()
  const { base, active } = styles[variant]

  return navItems
    .filter(
      ({ audience }) =>
        !audience ||
        (audience === 'admin' && isAdmin) ||
        (audience === 'buildingAdmin' && managedBuildingId),
    )
    .map(({ key, icon: Icon, to }) => (
      <Link
        key={key}
        to={to}
        params={{ buildingId: managedBuildingId ?? '' }}
        className={base}
        activeProps={{ className: active }}
      >
        <Icon className="size-5" />
        {t(`nav.${key}`)}
      </Link>
    ))
}
