import { useUser, type useClerk } from '@clerk/react'
import { z } from 'zod'

type Clerk = ReturnType<typeof useClerk>

/**
 * The loaded Clerk instance, for code outside React (route guards, query functions).
 * ClerkJS registers itself on `window`; the router only renders once it has loaded.
 */
function clerk(): Clerk | undefined {
  return (window as { Clerk?: Clerk }).Clerk
}

export function isAuthenticated() {
  return clerk()?.isSignedIn ?? false
}

/** Clerk user id of whoever is signed in — what the backend stores as `userId` */
export function currentUserId(): string {
  const userId = clerk()?.user?.id
  if (!userId) throw new Error('Not signed in')
  return userId
}

/** The building the user was invited to (invitation public metadata), if any */
export function currentBuildingId(): string | undefined {
  return clerk()?.user?.publicMetadata.buildingId
}

/**
 * Admins manage every building and are marked by hand in the Clerk dashboard (Users → user →
 * Public metadata: `{ "role": "ADMIN" }`). Building admins manage only the building they live
 * in (`buildingId`) and get the role through their invitation. These only hide pages; the
 * backend enforces the same rules.
 */
export function isAdmin() {
  return clerk()?.user?.publicMetadata.role === 'ADMIN'
}

export function useIsAdmin() {
  return useUser().user?.publicMetadata.role === 'ADMIN'
}

function managedBuilding(metadata: UserPublicMetadata | undefined) {
  return metadata?.role === 'BUILDING_ADMIN' ? metadata.buildingId : undefined
}

/** The building a building admin manages; undefined for everyone else, admins included */
export function useManagedBuildingId() {
  return managedBuilding(useUser().user?.publicMetadata)
}

/** Whether the signed-in user may open a building's admin page */
export function canManageBuilding(buildingId: string) {
  return isAdmin() || managedBuilding(clerk()?.user?.publicMetadata) === buildingId
}

// Only follow same-origin paths so ?redirect= can't bounce users to another site
export const authSearchSchema = z.object({
  redirect: z
    .string()
    .refine((path) => path.startsWith('/') && !path.startsWith('//'))
    .optional()
    .catch(undefined),
})

// What the backend's invite endpoint stores on the Clerk user (InviteUserDto minus email),
// where `role` is BUILDING_ADMIN or absent; ADMIN is set by hand
declare global {
  interface UserPublicMetadata {
    role?: 'ADMIN' | 'BUILDING_ADMIN'
    buildingId?: string
    apartment?: string
    eBlocUserID?: string
  }
}
