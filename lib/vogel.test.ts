import { describe, it, expect } from 'vitest'
import { layout } from './vogel'
import { SPECIES } from './species'

const peony = SPECIES.find((s) => s.id === 'peony')!
const tulip = SPECIES.find((s) => s.id === 'tulip')!
const params = { density: 17, tilt: 0.47, rotation: 0, jitter: 0.5, spread: 0.55 }

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
    const euca = SPECIES.find((s) => s.id === 'euca')!
    const stems = [
      { uid: 1, species: euca },
      { uid: 2, species: peony },
    ]

    const placed = layout(stems, params)
    const peonyStep = placed.find((p) => p.species.id === 'peony')!
    const eucaStep = placed.find((p) => p.species.id === 'euca')!

    expect(peonyStep.n).toBeLessThan(eucaStep.n)
  })
})
