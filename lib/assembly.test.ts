import { describe, it, expect } from 'vitest'
import { buildAssemblyDiagram, BIND_RATIO, MAX_TILT_DEG, HANDLE_CM } from './assembly'
import type { PlacedStem } from './vogel'
import { GOLDEN } from './vogel'
import { SPECIES } from './species'

const peonia = SPECIES.find((s) => s.id === 'peonia')! // lengthCm: 55
const ranunculo = SPECIES.find((s) => s.id === 'ranunculo')! // lengthCm: 28

function fixture(overrides: Partial<PlacedStem>): PlacedStem {
  return {
    uid: 1,
    species: peonia,
    n: 1,
    x: 0,
    y: -140,
    r: 20,
    theta: GOLDEN,
    depth: -1,
    sortKey: -20,
    scale: 1,
    tone: 0.8,
    ...overrides,
  }
}

describe('buildAssemblyDiagram', () => {
  it('computes angleDeg from theta and cutCm/handleCm from the catalog length', () => {
    const [step] = buildAssemblyDiagram([fixture({})])
    expect(step!.angleDeg).toBeCloseTo(137.5, 6)
    expect(step!.cutCm).toBe(55)
    expect(step!.handleCm).toBeCloseTo(12.1, 6)
    expect(step!.leanDeg).toBeCloseTo(7.399594659887109, 6)
    expect(step!.exceedsMaxTilt).toBe(false)
  })

  it('normalizes negative angles into 0-360', () => {
    const [step] = buildAssemblyDiagram([fixture({ theta: -Math.PI / 2 })])
    expect(step!.angleDeg).toBeCloseTo(270, 6)
  })

  it('carries hand order from the placement n', () => {
    const [step] = buildAssemblyDiagram([fixture({ n: 5 })])
    expect(step!.handOrder).toBe(5)
  })

  it('carries species name and uid through', () => {
    const [step] = buildAssemblyDiagram([fixture({ uid: 7 })])
    expect(step!.uid).toBe(7)
    expect(step!.speciesName).toBe('Peonía')
  })

  it('floors the handle length at HANDLE_CM for short stems', () => {
    const [step] = buildAssemblyDiagram([fixture({ species: ranunculo })])
    expect(step!.cutCm).toBe(28)
    expect(step!.handleCm).toBe(8)
  })

  it('flags exceedsMaxTilt when the lean angle passes MAX_TILT_DEG', () => {
    const [step] = buildAssemblyDiagram([fixture({ r: 200 })])
    expect(step!.leanDeg).toBeGreaterThan(MAX_TILT_DEG)
    expect(step!.exceedsMaxTilt).toBe(true)
  })

  it('exposes documented estimate constants as positive numbers', () => {
    expect(BIND_RATIO).toBeGreaterThan(0)
    expect(MAX_TILT_DEG).toBeGreaterThan(0)
    expect(HANDLE_CM).toBeGreaterThan(0)
  })
})
