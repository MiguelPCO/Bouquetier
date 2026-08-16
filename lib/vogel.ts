import type { Species, Stem, Role } from './species'

export const GOLDEN = (137.5 * Math.PI) / 180
export const PX_PER_CM = 2.8

export function headPx(species: Species): number {
  return (species.headMm / 10) * PX_PER_CM
}

export function stemPx(species: Species): number {
  return species.lengthCm * PX_PER_CM
}

export const AUTO_DENSITY_FACTOR = 0.86

export function autoDensity(stems: Stem[]): number {
  if (!stems.length) return 0
  const avgHeadPx = stems.reduce((sum, stem) => sum + headPx(stem.species), 0) / stems.length
  return Math.round(avgHeadPx * AUTO_DENSITY_FACTOR)
}

const ROLE_RANK: Record<Role, number> = { focal: 0, secondary: 1, filler: 2, green: 3 }
export const ROLE_SPREAD: Record<Role, number> = { focal: 0.70, secondary: 0.93, filler: 1.15, green: 1.36 }

export function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export interface Composition {
  density: number
  tiltDeg: number
  rotation: number
  jitter: number
  spread: number
}

export const DEFAULT_COMPOSITION: Omit<Composition, 'density'> = {
  tiltDeg: 62,
  rotation: 0,
  jitter: 0.5,
  spread: 0.55,
}

export interface PlacedStem extends Stem {
  n: number
  x: number
  y: number
  r: number
  theta: number
  depth: number
  sortKey: number
  scale: number
  tone: number
}

export function layout(stems: Stem[], { density, tiltDeg, rotation, jitter, spread }: Composition): PlacedStem[] {
  const tilt = Math.cos((tiltDeg * Math.PI) / 180)

  const ordered = [...stems].sort((a, b) => {
    const r = ROLE_RANK[a.species.role] - ROLE_RANK[b.species.role]
    return r !== 0 ? r : a.uid - b.uid
  })

  const placed = ordered.map((stem, i) => {
    const n = i + 1
    const ja = noise(stem.uid) - 0.5
    const jb = noise(stem.uid + 97) - 0.5

    const theta = n * GOLDEN + rotation + ja * jitter * 0.9
    const silhouette = lerp(1, ROLE_SPREAD[stem.species.role], spread)
    const r = density * Math.sqrt(n) * silhouette * (1 + jb * jitter * 0.35)

    const sin = Math.sin(theta)
    const stemLenPx = stemPx(stem.species)
    const x = r * Math.cos(theta)
    const y = r * sin * tilt - stemLenPx * (1 + jb * 0.05)

    return {
      ...stem,
      n,
      x,
      y,
      r,
      theta,
      depth: sin,
      sortKey: r * sin,
      scale: 1 + sin * 0.16,
      tone: 0.72 + (sin + 1) * 0.14,
    }
  })

  return placed.sort((a, b) => a.sortKey - b.sortKey)
}
