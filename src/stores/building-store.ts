import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

interface BuildingState {
  /** The building picked in the switcher; null means the user's oldest */
  selectedBuildingId: string | null
  select: (buildingId: string | null) => void
}

/**
 * Which of their buildings an admin in several is managing ("My building"), remembered on
 * this device. Residents don't pick one: each action names its building.
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
