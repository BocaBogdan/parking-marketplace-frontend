import { useEffect } from 'react'
import { useAuth, useClerk } from '@clerk/react'
import { useQueryClient, useQueryErrorResetBoundary } from '@tanstack/react-query'
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ApiError } from '@/lib/api'

/**
 * Shown when a page can't load, instead of the router's bare error: the user can always try
 * again or sign out, and a server error's reference matches its line in the backend logs.
 */
export function RouteError({ error }: ErrorComponentProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()
  const { isSignedIn } = useAuth()
  const { signOut } = useClerk()

  // Lets suspense queries that failed fetch again when the page reloads
  useEffect(() => {
    queryErrorResetBoundary.reset()
  }, [queryErrorResetBoundary])

  const errorId = error instanceof ApiError ? error.errorId : undefined
  const message = error instanceof ApiError ? t('errors.generic') : t('errors.network')

  const logout = async () => {
    await signOut({ redirectUrl: '/login' })
    // Clear only after leaving the signed-in pages, or their queries refetch without a token
    queryClient.clear()
  }

  return (
    <div className="flex min-h-[60svh] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('errors.pageTitle')}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {errorId && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('errors.reference')} <code className="font-mono select-all">{errorId}</code>
            </p>
          </CardContent>
        )}
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={() => void router.invalidate()}>{t('errors.retry')}</Button>
          {isSignedIn && (
            <Button variant="outline" onClick={() => void logout()}>
              {t('errors.signOut')}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
