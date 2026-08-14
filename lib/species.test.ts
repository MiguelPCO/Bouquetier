import { describe, it, expect } from 'vitest'
import { SPECIES, SPECIES_BY_ROLE } from './species'

describe('species catalog', () => {
  it('has 12 unique species ids', () => {
    expect(SPECIES).toHaveLength(12)
    expect(new Set(SPECIES.map((s) => s.id)).size).toBe(12)
  })

  it('every species has positive commercial dimensions', () => {
    for (const s of SPECIES) {
      expect(s.lengthCm).toBeGreaterThan(0)
      expect(s.headMm).toBeGreaterThan(0)
    }
  })

  it('groups every species under its role', () => {
    const total = Object.values(SPECIES_BY_ROLE).reduce((sum, list) => sum + list.length, 0)
    expect(total).toBe(SPECIES.length)
  })
})
