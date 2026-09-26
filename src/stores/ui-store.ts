import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// Client-only UI state. Server data belongs in TanStack Query, and
// shareable state (filters, pagination) belongs in route search params.
interface UiState {
  isMobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  toggleMobileNav: () => void
}

export const useUiStore = create<UiState>()(
  devtools(
    (set) => ({
      isMobileNavOpen: false,
      setMobileNavOpen: (open) => set({ isMobileNavOpen: open }, undefined, 'ui/setMobileNavOpen'),
      toggleMobileNav: () =>
        set(
          (state) => ({ isMobileNavOpen: !state.isMobileNavOpen }),
          undefined,
          'ui/toggleMobileNav',
        ),
    }),
    { name: 'ui-store', enabled: import.meta.env.DEV },
  ),
)
