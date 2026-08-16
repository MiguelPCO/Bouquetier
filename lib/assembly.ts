import type { PlacedStem } from './vogel'
import { stemPx } from './vogel'

/** Handle length as a fraction of the stem's total finished length. Estimate, unvalidated — pending florist questionnaire. */
export const BIND_RATIO = 0.22

/** Informational lean-angle ceiling from vertical, in degrees. Estimate, unvalidated — pending florist questionnaire. */
export const MAX_TILT_DEG = 45

/** Minimum hand-grip length below the tie point, in cm. Estimate, unvalidated — pending florist questionnaire. */
export const HANDLE_CM = 8

export interface AssemblyStep {
  uid: number
  speciesName: string
  handOrder: number
  angleDeg: number
  cutCm: number
  handleCm: number
  leanDeg: number
  exceedsMaxTilt: boolean
}

function normalizeDeg(deg: number): number {
  const wrapped = deg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

export function buildAssemblyDiagram(placed: PlacedStem[]): AssemblyStep[] {
  return placed.map((stem) => {
    const angleDeg = normalizeDeg((stem.theta * 180) / Math.PI)
    const cutCm = stem.species.lengthCm
    const handleCm = Math.max(HANDLE_CM, cutCm * BIND_RATIO)
    const leanDeg = (Math.atan2(stem.r, stemPx(stem.species)) * 180) / Math.PI

    return {
      uid: stem.uid,
      speciesName: stem.species.name,
      handOrder: stem.n,
      angleDeg,
      cutCm,
      handleCm,
      leanDeg,
      exceedsMaxTilt: leanDeg > MAX_TILT_DEG,
    }
  })
}
