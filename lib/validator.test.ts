import { describe, it, expect } from 'vitest'
import { validateComposition } from './validator'
import { SPECIES } from './species'

const peonia = SPECIES.find((s) => s.id === 'peonia')! // focal, rosa, season 4-8
const paniculata = SPECIES.find((s) => s.id === 'paniculata')! // filler, blanco, all-year
const girasol = SPECIES.find((s) => s.id === 'girasol')! // focal, amarillo, season 6-10
const gerbera = SPECIES.find((s) => s.id === 'gerbera')! // focal, naranja, all-year
const fresia = SPECIES.find((s) => s.id === 'fresia')! // secondary, amarillo
const orchid = SPECIES.find((s) => s.id === 'orquidea-cymbidium')! // focal, verde
const iris = SPECIES.find((s) => s.id === 'iris-holandes')! // secondary, azul

describe('validateComposition', () => {
  it('returns no warnings for an empty composition', () => {
    expect(validateComposition([], 1)).toEqual([])
  })

  it('returns no warnings for a balanced, in-season, low-color-variety composition', () => {
    // peonia + fresia both in season in April
    const results = validateComposition([{ uid: 1, species: peonia }, { uid: 2, species: fresia }], 4)
    expect(results).toEqual([])
  })

  it('warns when no focal stem is present', () => {
    const results = validateComposition([{ uid: 1, species: paniculata }], 1)
    expect(results).toContainEqual({
      rule: 'role-balance',
      message: 'La composición no tiene ninguna flor focal.',
    })
  })

  it('warns when one role exceeds 70% of total stems, without a duplicate no-focal warning', () => {
    // month 6: peonia (focal) and paniculata (filler) both in season
    const results = validateComposition(
      [
        { uid: 1, species: peonia },
        { uid: 2, species: paniculata },
        { uid: 3, species: paniculata },
        { uid: 4, species: paniculata },
        { uid: 5, species: paniculata },
      ],
      6
    )
    expect(results).toEqual([{ rule: 'role-balance', message: 'El rol "filler" representa más del 70% de los tallos.' }])
  })

  it('warns once, naming all out-of-season stems', () => {
    // peonia (4-8) and girasol (6-10) are both out of season in December
    const results = validateComposition([{ uid: 1, species: peonia }, { uid: 2, species: girasol }], 12)
    expect(results).toContainEqual({
      rule: 'season',
      message: 'Fuera de temporada: Peonía, Girasol.',
    })
  })

  it('warns when more than 4 color families are present', () => {
    // peonia(rosa) + gerbera(naranja) + fresia(amarillo) + orchid(verde) + iris(azul), all in season in April
    const results = validateComposition(
      [
        { uid: 1, species: peonia },
        { uid: 2, species: gerbera },
        { uid: 3, species: fresia },
        { uid: 4, species: orchid },
        { uid: 5, species: iris },
      ],
      4
    )
    expect(results).toContainEqual({
      rule: 'color-clash',
      message: 'Más de 4 familias de color distintas — riesgo de sobrecarga visual.',
    })
  })

  it('does not warn about color clash at exactly 4 families', () => {
    const results = validateComposition(
      [
        { uid: 1, species: peonia },
        { uid: 2, species: gerbera },
        { uid: 3, species: fresia },
        { uid: 4, species: orchid },
      ],
      4
    )
    expect(results.some((r) => r.rule === 'color-clash')).toBe(false)
  })
})
