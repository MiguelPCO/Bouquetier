import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SPECIES, type Species, type Stem } from '@/lib/species'

interface BouquetState {
  stems: Stem[]
  nextUid: number
  add: (species: Species) => void
  remove: (speciesId: string) => void
  setStems: (stems: Stem[]) => void
}

function resolveStems(rawStems: unknown): Stem[] {
  if (!Array.isArray(rawStems)) return []
  const resolved: Stem[] = []
  for (const raw of rawStems) {
    if (!raw || typeof raw !== 'object' || !('uid' in raw) || !('species' in raw)) continue
    const rawSpecies = (raw as { species: unknown }).species
    const speciesId = rawSpecies && typeof rawSpecies === 'object' && 'id' in rawSpecies ? (rawSpecies as { id: unknown }).id : undefined
    if (typeof speciesId !== 'string') continue
    const species = SPECIES.find((s) => s.id === speciesId)
    if (!species) continue
    resolved.push({ uid: (raw as { uid: number }).uid, species })
  }
  return resolved
}

export const useBouquetStore = create<BouquetState>()(
  persist(
    (set) => ({
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
      setStems: (stems) =>
        set(() => ({
          stems,
          nextUid: stems.reduce((max, s) => Math.max(max, s.uid), 0) + 1,
        })),
    }),
    {
      name: 'bouquetier-bouquet',
      version: 1,
      merge: (persisted, current) => {
        const raw = persisted as { stems?: unknown; nextUid?: unknown } | undefined
        const stems = resolveStems(raw?.stems)
        const nextUid = typeof raw?.nextUid === 'number' ? raw.nextUid : current.nextUid
        return { ...current, stems, nextUid }
      },
    }
  )
)
