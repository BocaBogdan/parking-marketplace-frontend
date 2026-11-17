import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

interface BuildingState {
  /** The building picked in the switcher; null means the user's oldest (the API's default) */
  selectedBuildingId: string | null
  select: (buildingId: string | null) => void
}

/**
 * Which of their buildings someone in several is acting in, remembered on this device.
 * `lib/api` sends it as `X-Building-Id`, and the API checks it against their memberships.
 */
export const useBuildingStore = create<BuildingState>()(
  devtools(
    persist(
      (set) => ({
        selectedBuildingId: null,
        select: (buildingId) =>
          set({ selectedBuildingId: buildingId }, undefined, 'building/select'),
      }),
      {
        name: 'parkspot-building',
        // createJSONStorage leaves the store in memory when storage is blocked
        storage: createJSONStorage(() => localStorage),
        partialize: ({ selectedBuildingId }) => ({ selectedBuildingId }),
      },
    ),
    { name: 'building', enabled: import.meta.env.DEV },
  ),
)
