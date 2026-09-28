import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { components } from '@/types/api'

type TokenPair = components['schemas']['TokenPair']

interface StoredTokens {
  accessToken: string
  refreshToken: string
}

// "Keep me signed in" decides where tokens live: localStorage survives closing the
// browser, sessionStorage is cleared with the tab. Only one of them holds tokens at a time.
const STORAGE_KEY = 'parkspot-auth'

function storageFor(remember: boolean): Storage {
  return remember ? localStorage : sessionStorage
}

function readStoredTokens(): { tokens: StoredTokens | null; remember: boolean } {
  for (const remember of [true, false]) {
    try {
      const raw = storageFor(remember).getItem(STORAGE_KEY)
      if (raw) return { tokens: JSON.parse(raw) as StoredTokens, remember }
    } catch {
      // Storage blocked or corrupt entry — treat as signed out
    }
  }
  return { tokens: null, remember: true }
}

function writeStoredTokens(tokens: StoredTokens | null, remember: boolean) {
  try {
    storageFor(!remember).removeItem(STORAGE_KEY)
    if (tokens) storageFor(remember).setItem(STORAGE_KEY, JSON.stringify(tokens))
    else storageFor(remember).removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable (e.g. private mode) — the session still works in memory
  }
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  remember: boolean
  signIn: (tokens: TokenPair, remember: boolean) => void
  updateTokens: (tokens: TokenPair) => void
  signOut: () => void
}

const initial = readStoredTokens()

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      accessToken: initial.tokens?.accessToken ?? null,
      refreshToken: initial.tokens?.refreshToken ?? null,
      remember: initial.remember,
      signIn: (tokens, remember) => {
        const stored = { accessToken: tokens.access_token, refreshToken: tokens.refresh_token }
        writeStoredTokens(stored, remember)
        set({ ...stored, remember }, undefined, 'auth/signIn')
      },
      updateTokens: (tokens) => {
        const stored = { accessToken: tokens.access_token, refreshToken: tokens.refresh_token }
        writeStoredTokens(stored, get().remember)
        set(stored, undefined, 'auth/updateTokens')
      },
      signOut: () => {
        writeStoredTokens(null, get().remember)
        set({ accessToken: null, refreshToken: null }, undefined, 'auth/signOut')
      },
    }),
    { name: 'auth-store', enabled: import.meta.env.DEV },
  ),
)
