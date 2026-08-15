import { describe, it, expect } from 'vitest'
import { SPECIES, SPECIES_BY_ROLE, SPECIES_SOURCES, colorFamily, filterSpecies } from './species'

describe('species catalog', () => {
  it('has 35 unique species ids', () => {
    expect(SPECIES).toHaveLength(35)
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(35)
  })

  it('every species has positive commercial dimensions', () => {
    for (const s of SPECIES) {
      expect(s.lengthCm).toBeGreaterThan(0)
      expect(s.headMm).toBeGreaterThan(0)
      expect(s.wholesale).toBeGreaterThan(0)
    }
  })

  it('groups every species under its role', () => {
    const total = Object.values(SPECIES_BY_ROLE).reduce((sum, list) => sum + list.length, 0)
    expect(total).toBe(SPECIES.length)
  })

  it('every species color is a valid oklch() string', () => {
    for (const s of SPECIES) {
      expect(s.color).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/)
    }
  })

  it('every species has a documented source', () => {
    for (const s of SPECIES) {
      expect(SPECIES_SOURCES[s.id]).toBeDefined()
      expect(SPECIES_SOURCES[s.id]!.price.length).toBeGreaterThan(0)
      expect(SPECIES_SOURCES[s.id]!.botany.length).toBeGreaterThan(0)
    }
  })
})

describe('colorFamily', () => {
  it('buckets every green-role species as verde regardless of hue', () => {
    for (const s of SPECIES_BY_ROLE.green) {
      expect(colorFamily(s)).toBe('verde')
    }
  })

  it('buckets a near-white low-chroma species as blanco', () => {
    const paniculata = SPECIES.find((s) => s.id === 'paniculata')!
    expect(colorFamily(paniculata)).toBe('blanco')
  })

  it('buckets a saturated pink hue as rosa', () => {
    const peonia = SPECIES.find((s) => s.id === 'peonia')!
    expect(colorFamily(peonia)).toBe('rosa')
  })

  it('buckets a saturated blue hue as azul', () => {
    const aciano = SPECIES.find((s) => s.id === 'aciano')!
    expect(colorFamily(aciano)).toBe('azul')
  })
})

describe('filterSpecies', () => {
  it('with no filter returns the full list unchanged', () => {
    expect(filterSpecies(SPECIES, {})).toHaveLength(SPECIES.length)
  })

  it('seasonOnly restricts to species available in the given month', () => {
    const june = filterSpecies(SPECIES, { seasonOnly: true, month: 6 })
    expect(june.length).toBeGreaterThan(0)
    expect(june.length).toBeLessThan(SPECIES.length)
    for (const s of june) {
      expect(s.season).toContain(6)
    }
  })

  it('colorFamilies restricts to the given families only', () => {
    const verdes = filterSpecies(SPECIES, { colorFamilies: ['verde'] })
    expect(verdes.length).toBeGreaterThan(0)
    for (const s of verdes) {
      expect(colorFamily(s)).toBe('verde')
    }
  })

  it('combines colorFamilies and seasonOnly', () => {
    const result = filterSpecies(SPECIES, { colorFamilies: ['rosa'], seasonOnly: true, month: 4 })
    for (const s of result) {
      expect(colorFamily(s)).toBe('rosa')
      expect(s.season).toContain(4)
    }
  })
})
