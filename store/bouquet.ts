import { create } from 'zustand'
import type { Species, Stem } from '@/lib/species'

interface BouquetState {
  stems: Stem[]
  nextUid: number
  add: (species: Species) => void
  remove: (speciesId: string) => void
}

export const useBouquetStore = create<BouquetState>((set) => ({
  stems: [],
  nextUid: 1,
  add: (species) =>
    set((state) => ({
      stems: [...state.stems, { uid: state.nextUid, species }],
      nextUid: state.nextUid + 1,
    })),
  remove: (speciesId) =>
    set((state) => {
      const reversedIdx = [...state.stems].reverse().findIndex((s) => s.species.id === speciesId)
      if (reversedIdx === -1) return state
      const realIdx = state.stems.length - 1 - reversedIdx
      return { stems: state.stems.filter((_, i) => i !== realIdx) }
    }),
}))
