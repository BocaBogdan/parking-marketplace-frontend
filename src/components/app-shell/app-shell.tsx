import { Outlet, useLocation } from '@tanstack/react-router'
import { BellIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AccountMenu } from '@/components/app-shell/account-menu'
import { LogoMark } from '@/components/app-shell/logo-mark'
import { navItems } from '@/components/app-shell/nav-items'
import { NavLinks } from '@/components/app-shell/nav-link'
import { useComingSoon } from '@/lib/coming-soon'

export function AppShell() {
  const { t } = useTranslation()
  const comingSoon = useComingSoon()
  const pathname = useLocation({ select: (location) => location.pathname })
  const current = navItems.find((item) => item.to && pathname.startsWith(item.to))

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
          <LogoMark />
          <div className="leading-tight">
            <p className="font-bold">{t('common.appName')}</p>
            {current && <p className="text-xs text-muted-foreground">{t(`nav.${current.key}`)}</p>}
          </div>
          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            <NavLinks variant="inline" />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={t('nav.notifications')}
              onClick={() => comingSoon(t('nav.notifications'))}
            >
              <BellIcon className="size-5" />
            </Button>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-5 pb-28 lg:pb-10">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <NavLinks variant="tab" />
      </nav>
    </div>
  )
}
