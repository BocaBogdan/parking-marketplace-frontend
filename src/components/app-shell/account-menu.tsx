import { useClerk, useUser } from '@clerk/react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import {
  Building2Icon,
  CoffeeIcon,
  ExternalLinkIcon,
  FileTextIcon,
  LanguagesIcon,
  LogOutIcon,
  MessageSquareTextIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { languages } from '@/i18n'
import { useCanSwitchBuilding, useCurrentMembership, useIsAdmin, useMemberships } from '@/lib/auth'
import { env } from '@/lib/env'
import { useBuildingStore } from '@/stores/building-store'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

export function AccountMenu() {
  const { t, i18n } = useTranslation()
  // Only rendered inside _authenticated, so Clerk has a signed-in user
  const { user } = useUser()
  const { signOut } = useClerk()
  const queryClient = useQueryClient()
  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || ''
  const memberships = useMemberships()
  const current = useCurrentMembership()
  const selectBuilding = useBuildingStore((state) => state.select)
  const isAdmin = useIsAdmin()
  const canSwitchBuilding = useCanSwitchBuilding()
  const navigate = useNavigate()
  // Set only on a building's admin pages (/building/$buildingId and its spot pages)
  const openBuildingId = useParams({ strict: false }).buildingId

  const switchBuilding = async (buildingId: string) => {
    const membership = memberships.find((m) => m.buildingId === buildingId)
    if (!membership || buildingId === current?.buildingId) return
    selectBuilding(buildingId)
    // On the admin pages of the building being left, follow the switch: the new building's
    // admin page if they manage it, else home. Other buildings (an admin browsing) stay open.
    if (openBuildingId && openBuildingId === current?.buildingId) {
      await (isAdmin || membership.role === 'BUILDING_ADMIN'
        ? navigate({ to: '/building/$buildingId', params: { buildingId } })
        : navigate({ to: '/home' }))
    }
    toast.success(t('account.building.switched', { name: membership.building.name }))
  }

  const logout = async () => {
    await signOut({ redirectUrl: '/login' })
    // Clear only after leaving the signed-in pages, or their queries refetch without a token
    queryClient.clear()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t('nav.accountMenu')}
        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar className="size-9">
          {user?.hasImage && <AvatarImage src={user.imageUrl} alt="" />}
          <AvatarFallback className="bg-primary-100 font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="grid">
          <span className="truncate font-semibold text-foreground">{name}</span>
          <span className="truncate font-normal">{user?.primaryEmailAddress?.emailAddress}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {canSwitchBuilding && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Building2Icon className="size-4" />
              {t('account.building.title')}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={current?.buildingId}
              onValueChange={(buildingId) => void switchBuilding(buildingId)}
            >
              {memberships.map((membership) => (
                <DropdownMenuRadioItem key={membership.buildingId} value={membership.buildingId}>
                  <span className="truncate">{membership.building.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuLabel className="flex items-center gap-2">
          <LanguagesIcon className="size-4" />
          {t('common.language')}
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={i18n.resolvedLanguage}
          onValueChange={(code) => void i18n.changeLanguage(code)}
        >
          {languages.map((language) => (
            <DropdownMenuRadioItem key={language.code} value={language.code} lang={language.code}>
              {language.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        {env.feedbackFormUrl && (
          <DropdownMenuItem asChild>
            <Link to="/feedback">
              <MessageSquareTextIcon />
              {t('nav.feedback')}
            </Link>
          </DropdownMenuItem>
        )}
        {env.donationUrl && (
          <DropdownMenuItem asChild>
            <a href={env.donationUrl} target="_blank" rel="noreferrer">
              <CoffeeIcon />
              {t('nav.donate')}
              <ExternalLinkIcon className="ml-auto text-muted-foreground" />
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/terms">
            <FileTextIcon />
            {t('common.terms')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => void logout()}>
          <LogOutIcon />
          {t('auth.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
