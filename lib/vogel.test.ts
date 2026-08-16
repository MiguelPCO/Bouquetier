import { describe, it, expect } from 'vitest'
import { layout, DEFAULT_COMPOSITION, GOLDEN } from './vogel'
import { SPECIES } from './species'

const peony = SPECIES.find((s) => s.id === 'peonia')!
const tulip = SPECIES.find((s) => s.id === 'tulipan')!
const params = { density: 17, tiltDeg: 62, rotation: 0, jitter: 0.5, spread: 0.55 }

describe('layout', () => {
  it('is deterministic for the same stems and params', () => {
    const stems = [
      { uid: 1, species: peony },
      { uid: 2, species: tulip },
      { uid: 3, species: peony },
    ]

    const a = layout(stems, params)
    const b = layout(stems, params)

    expect(a).toEqual(b)
  })

  it('produces a different placement for a different uid', () => {
    const a = layout([{ uid: 1, species: peony }], params)
    const b = layout([{ uid: 2, species: peony }], params)

    expect(a[0]!.x).not.toBeCloseTo(b[0]!.x, 5)
  })

  it('orders focal stems before green stems', () => {
    const euca = SPECIES.find((s) => s.id === 'eucalipto')!
    const stems = [
      { uid: 1, species: euca },
      { uid: 2, species: peony },
    ]

    const placed = layout(stems, params)
    const peonyStep = placed.find((p) => p.species.id === 'peonia')!
    const eucaStep = placed.find((p) => p.species.id === 'eucalipto')!

    expect(peonyStep.n).toBeLessThan(eucaStep.n)
  })

  it('matches a pinned golden value for the ported layout math', () => {
    const stems = [{ uid: 1, species: peony }]
    const [placed] = layout(stems, { density: 20, tiltDeg: 0, rotation: 0, jitter: 0, spread: 0 })

    expect(placed!.x).toBeCloseTo(-14.7455467362, 6)
  })

  it('exposes a DEFAULT_COMPOSITION matching the canvas defaults', () => {
    expect(DEFAULT_COMPOSITION).toEqual({
      tiltDeg: 62,
      rotation: 0,
      jitter: 0.5,
      spread: 0.55,
    })
  })

  it('returns the spiral angle theta for each placed stem', () => {
    const stems = [{ uid: 1, species: peony }]
    const [placed] = layout(stems, { density: 20, tiltDeg: 0, rotation: 0, jitter: 0, spread: 0 })

    expect(placed!.theta).toBeCloseTo(GOLDEN, 10)
  })
})
