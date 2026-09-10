import { describe, it, expect, beforeEach } from 'vitest'
import { useBouquetStore } from './bouquet'
import { SPECIES } from '@/lib/species'

const peonia = SPECIES.find((s) => s.id === 'peonia')!
const dalia = SPECIES.find((s) => s.id === 'dalia')!

beforeEach(() => {
  useBouquetStore.setState({ stems: [], nextUid: 1 })
})

describe('setStems', () => {
  it('replaces the stems array entirely', () => {
    useBouquetStore.getState().add(dalia)
    useBouquetStore.getState().setStems([{ uid: 1, species: peonia }])
    expect(useBouquetStore.getState().stems).toEqual([{ uid: 1, species: peonia }])
  })

  it('sets nextUid to one past the highest incoming uid', () => {
    useBouquetStore.getState().setStems([
      { uid: 1, species: peonia },
      { uid: 5, species: dalia },
    ])
    expect(useBouquetStore.getState().nextUid).toBe(6)
  })

  it('resets nextUid to 1 for an empty bouquet', () => {
    useBouquetStore.getState().setStems([{ uid: 3, species: peonia }])
    useBouquetStore.getState().setStems([])
    expect(useBouquetStore.getState().nextUid).toBe(1)
  })

  it('a subsequent add() does not collide with restored uids', () => {
    useBouquetStore.getState().setStems([{ uid: 7, species: peonia }])
    useBouquetStore.getState().add(dalia)
    const uids = useBouquetStore.getState().stems.map((s) => s.uid)
    expect(new Set(uids).size).toBe(uids.length)
    expect(uids).toContain(8)
  })
})
