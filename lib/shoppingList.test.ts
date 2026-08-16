import { describe, it, expect } from 'vitest'
import { buildShoppingList, totalCost } from './shoppingList'
import { SPECIES } from './species'

const tulipan = SPECIES.find((s) => s.id === 'tulipan')!
const peonia = SPECIES.find((s) => s.id === 'peonia')!

describe('buildShoppingList', () => {
  it('groups stems by species id and counts occurrences', () => {
    const list = buildShoppingList(
      [
        { uid: 1, species: tulipan },
        { uid: 2, species: tulipan },
        { uid: 3, species: peonia },
      ],
      1
    )
    expect(list.find((l) => l.speciesId === 'tulipan')!.count).toBe(2)
    expect(list.find((l) => l.speciesId === 'peonia')!.count).toBe(1)
  })

  it('computes subtotal as unitPrice times count', () => {
    const list = buildShoppingList(
      [
        { uid: 1, species: tulipan },
        { uid: 2, species: tulipan },
      ],
      1
    )
    const line = list.find((l) => l.speciesId === 'tulipan')!
    expect(line.unitPrice).toBe(3.44)
    expect(line.subtotal).toBeCloseTo(6.88, 6)
  })

  it('totalCost sums all line subtotals', () => {
    const list = buildShoppingList(
      [
        { uid: 1, species: tulipan },
        { uid: 2, species: peonia },
      ],
      1
    )
    expect(totalCost(list)).toBeCloseTo(3.44 + 1.5, 6)
  })

  it('returns no substitutes when the species is in season', () => {
    // tulipan season includes January
    const list = buildShoppingList([{ uid: 1, species: tulipan }], 1)
    expect(list[0]!.inSeason).toBe(true)
    expect(list[0]!.substitutes).toEqual([])
  })

  it('suggests an in-season same-role-and-color substitute when out of season', () => {
    // tulipan (secondary, rojo) is out of season in October; anemona (secondary, rojo) is in season then
    const list = buildShoppingList([{ uid: 1, species: tulipan }], 10)
    expect(list[0]!.inSeason).toBe(false)
    expect(list[0]!.substitutes.map((s) => s.id)).toEqual(['anemona'])
  })

  it('caps substitutes at 2, sorted by price closeness, when more than 2 candidates qualify', () => {
    // peonia (focal, rosa) out of season in October; dalia/rosa-inglesa/protea (focal, rosa) all in season then
    // price diffs from peonia (1.5): dalia 2.81, rosa-inglesa 6.93, protea 23.57 -> top 2 by closeness
    const list = buildShoppingList([{ uid: 1, species: peonia }], 10)
    expect(list[0]!.inSeason).toBe(false)
    expect(list[0]!.substitutes.map((s) => s.id)).toEqual(['dalia', 'rosa-inglesa'])
  })

  it('returns empty substitutes when no other species shares role and color family', () => {
    // orquidea-cymbidium is the only focal+verde species in the catalog
    const orchid = SPECIES.find((s) => s.id === 'orquidea-cymbidium')!
    const list = buildShoppingList([{ uid: 1, species: orchid }], 7)
    expect(list[0]!.inSeason).toBe(false)
    expect(list[0]!.substitutes).toEqual([])
  })
})
