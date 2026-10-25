import type { AppUser } from '@/types/models'

/** "Ana Pop", or empty when the account has no name — fall back to the email then */
export function displayName({ firstName, lastName }: Pick<AppUser, 'firstName' | 'lastName'>) {
  return [firstName, lastName].filter(Boolean).join(' ')
}
