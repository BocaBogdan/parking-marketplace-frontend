import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAdmin } from '@/lib/auth'

// Pathless layout: every route under _admin/ is for admins only
export const Route = createFileRoute('/_authenticated/_admin')({
  beforeLoad: () => {
    if (!isAdmin()) throw redirect({ to: '/home' })
  },
})
