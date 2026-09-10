import { describe, it, expect } from 'vitest'
import { encodeShareLink, decodeShareLink, describeShareBouquet } from './shareLink'
import { SPECIES } from './species'

const peonia = SPECIES.find((s) => s.id === 'peonia')!
const dalia = SPECIES.find((s) => s.id === 'dalia')!
const eucalipto = SPECIES.find((s) => s.id === 'eucalipto')!

describe('encodeShareLink', () => {
  it('returns an empty string for an empty bouquet', () => {
    expect(encodeShareLink([])).toBe('')
  })

  it('encodes species:count pairs in first-appearance order', () => {
    const stems = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: peonia },
    ]
    expect(encodeShareLink(stems)).toBe('peonia:2,dalia:1')
  })
})

describe('decodeShareLink', () => {
  it('returns an empty array for null, undefined, or empty input', () => {
    expect(decodeShareLink(null)).toEqual([])
    expect(decodeShareLink(undefined)).toEqual([])
    expect(decodeShareLink('')).toEqual([])
  })

  it('reconstructs stems with sequential uids starting at 1', () => {
    const stems = decodeShareLink('peonia:2,dalia:1')
    expect(stems).toEqual([
      { uid: 1, species: peonia },
      { uid: 2, species: peonia },
      { uid: 3, species: dalia },
    ])
  })

  it('round-trips through encodeShareLink', () => {
    const original = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: eucalipto },
    ]
    const roundTripped = decodeShareLink(encodeShareLink(original))
    expect(roundTripped).toEqual(original)
  })

  it('skips unknown species ids without throwing', () => {
    expect(decodeShareLink('peonia:1,no-existe:3,dalia:2')).toEqual([
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: dalia },
    ])
  })

  it('skips entries with a non-numeric or non-positive count', () => {
    expect(decodeShareLink('peonia:0,dalia:-2,eucalipto:abc,tulipan:1')).toEqual([
      { uid: 1, species: SPECIES.find((s) => s.id === 'tulipan')! },
    ])
  })

  it('ignores malformed pairs missing the colon', () => {
    expect(decodeShareLink('peonia,dalia:2')).toEqual([
      { uid: 1, species: dalia },
      { uid: 2, species: dalia },
    ])
  })
})

describe('describeShareBouquet', () => {
  it('returns generic copy for an empty bouquet', () => {
    expect(describeShareBouquet([])).toEqual({
      title: 'Bouquetier',
      description: 'Compón un ramo y obtén la lista de la compra y el diagrama de montaje.',
    })
  })

  it('lists up to 3 distinct species by name, in first-appearance order', () => {
    const stems = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: peonia },
    ]
    expect(describeShareBouquet(stems)).toEqual({
      title: 'Bouquetier',
      description: 'Peonía y Dalia — mira este ramo',
    })
  })

  it('joins exactly 3 distinct species with a comma and "y"', () => {
    const stems = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: eucalipto },
    ]
    expect(describeShareBouquet(stems).description).toBe('Peonía, Dalia y Eucalipto — mira este ramo')
  })

  it('truncates to 3 species plus a count when there are more', () => {
    const tulipan = SPECIES.find((s) => s.id === 'tulipan')!
    const amarilis = SPECIES.find((s) => s.id === 'amarilis')!
    const stems = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: eucalipto },
      { uid: 4, species: tulipan },
      { uid: 5, species: amarilis },
    ]
    expect(describeShareBouquet(stems).description).toBe('Peonía, Dalia, Eucalipto y 2 más — mira este ramo')
  })
})
