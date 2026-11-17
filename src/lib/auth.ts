import { type useClerk } from '@clerk/react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { queryClient } from '@/lib/query-client'
import { meQuery } from '@/queries/me'
import { useBuildingStore } from '@/stores/building-store'
import type { Me } from '@/types/models'

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

/*
 * Clerk only signs people in. What they may do comes from GET /user/me, which the
 * _authenticated layout loads before any child guard runs:
 * - admins (`isAdmin`, set by hand in the database) manage every building;
 * - building admins manage each building where their membership has that role;
 * - anyone can belong to several buildings: they pick one when adding a spot, and Find
 *   searches all of them. Admins also pick which building "My building" opens.
 * These only hide pages; the backend enforces the same rules.
 */

export type Membership = Me['memberships'][number]

/** For guards outside React; the _authenticated layout has loaded it by then */
function cachedMe() {
  return queryClient.getQueryData(meQuery.queryKey)
}

/** Oldest first, the order the API picks its default building in */
function sortedMemberships(me: Me | undefined) {
  return [...(me?.memberships ?? [])].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

function managedBuildingIds(me: Me | undefined) {
  return sortedMemberships(me)
    .filter((membership) => membership.role === 'BUILDING_ADMIN')
    .map((membership) => membership.buildingId)
}

/** The user's first building, where a new spot goes by default; for loaders */
export function defaultBuildingId() {
  return sortedMemberships(cachedMe())[0]?.buildingId
}

export function isAdmin() {
  return cachedMe()?.isAdmin ?? false
}

export function useIsAdmin() {
  return useQuery(meQuery).data?.isAdmin ?? false
}

/** Whether the signed-in user may open a building's admin page */
export function canManageBuilding(buildingId: string) {
  const me = cachedMe()
  return !!me && (me.isAdmin || managedBuildingIds(me).includes(buildingId))
}

/** The user's buildings, oldest first */
export function useMemberships() {
  return sortedMemberships(useQuery(meQuery).data)
}

/** The admin switcher's building while it's still theirs, else the oldest */
export function useCurrentMembership(): Membership | undefined {
  const memberships = useMemberships()
  const selected = useBuildingStore((state) => state.selectedBuildingId)
  return memberships.find((m) => m.buildingId === selected) ?? memberships[0]
}

/** Building names by id, for labelling spots of people in several buildings */
export function useBuildingNames() {
  const memberships = useMemberships()
  return {
    /** Whether labels are worth showing: the user is in more than one building */
    show: memberships.length > 1,
    nameOf: (buildingId: string) =>
      memberships.find((m) => m.buildingId === buildingId)?.building.name,
  }
}

/** The building switcher is for admins and building admins with more than one building */
export function useCanSwitchBuilding() {
  const memberships = useMemberships()
  const isAdmin = useIsAdmin()
  return (
    memberships.length > 1 &&
    (isAdmin || memberships.some((membership) => membership.role === 'BUILDING_ADMIN'))
  )
}

/**
 * The building "My building" opens: the current one if they manage it, else the first they
 * manage; undefined for anyone who manages none (admins reach buildings from the list).
 */
export function useManagedBuildingId() {
  const current = useCurrentMembership()
  const managed = managedBuildingIds(useQuery(meQuery).data)
  return current?.role === 'BUILDING_ADMIN' ? current.buildingId : managed[0]
}

// Only follow same-origin paths so ?redirect= can't bounce users to another site
export const authSearchSchema = z.object({
  redirect: z
    .string()
    .refine((path) => path.startsWith('/') && !path.startsWith('//'))
    .optional()
    .catch(undefined),
})
