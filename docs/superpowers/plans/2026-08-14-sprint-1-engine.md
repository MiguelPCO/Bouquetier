# Sprint 1 — Motor (Composition Engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the validated prototype's Vogel-spiral composition engine into the real Next.js architecture — typed species catalog, pure layout math, Zustand store, and an SVG canvas — with flower illustrations upgraded from the prototype's flat circle placeholders to layered, gradient-shaded botanical SVGs closer to the two visual references the user supplied.

**Architecture:** `lib/species.ts` owns the data model (types + 12-species catalog, OKLCH colors). `lib/vogel.ts` is the pure geometry engine (no React, no DOM) — the Vogel spiral placement math ported verbatim from the prototype, unit-tested for determinism. `store/bouquet.ts` is a small Zustand store holding just the stem list (add/remove) — composition parameters (tilt/rotation/jitter/spread) stay as fixed constants in `BouquetCanvas.tsx` for now; interactive sliders are Sprint 3/6 UI polish, out of scope here per this session's scope decision. `components/FlowerHead.tsx` is pure presentation — one SVG illustration per `Shape`, each built from layered petal paths with radial gradients and `noise()`-jittered rotation/scale for an organic, non-mechanical look, replacing the prototype's flat opacity-stacked circles. `components/BouquetCanvas.tsx` and `components/SpeciesCatalog.tsx` wire store + engine + illustrations into a minimal but functional compose UI, replacing the Sprint 0 placeholder `app/page.tsx`.

**Tech Stack:** Next.js 15 / React 19 / TypeScript strict (existing) · Zustand (new) · Vitest + vite-tsconfig-paths (new, for the determinism unit test SPRINTS.md requires) · Tailwind v4 utilities against the existing `tokens/theme.css` OKLCH tokens.

**Spec:** `SCHEMA.md` (data model — `Species`, `Stem`, `PlacedStem`, `Composition` interfaces and the derivation rule), `SPRINTS.md` (Sprint 1 section — exact file list and "hecho cuando" bar), `PRD.md` §5 (why Vogel-spiral placement, why 2.5D), `START.md` (non-negotiable rules: cream canvas, derived pixels, determinism), `spiral-bouquet-prototype.jsx` (the validated math and catalog this ports from), `CLAUDE.md` (project overview, already reflects these).

## Global Constraints

- Canvas stays `#EDECE6` cream, never dark — already fixed in Sprint 0, don't touch.
- Every size in pixels must be *derived* from `lengthCm`/`headMm` via `PX_PER_CM = 2.8` — never hand-write a pixel value.
- All jitter/organic variation comes from `noise(uid)` (deterministic sine hash), never `Math.random()`. Same stems, same `uid`s → pixel-identical layout every time.
- TypeScript strict is already configured (Sprint 0's `tsconfig.json` additions) — new code must satisfy it, including `noUncheckedIndexedAccess`.
- Species `color` field is OKLCH in production (SCHEMA.md) — hex is prototype-only.
- No validator, shopping list, or assembly diagram yet — those are Sprint 3. No GSAP/nuqs yet — Sprint 5/6.
- UI stays functional-minimal (catalog list + canvas), no bottom-sheet/editor chrome polish — that's deferred to Sprint 3/6 per this session's decision; the two references inform illustration fidelity now, not layout chrome.

---

## File Structure

- **Create** `lib/species.ts` — `Role`, `Shape`, `Species`, `Stem` types; `SPECIES` catalog (12 entries, OKLCH colors); `SPECIES_BY_ROLE` grouping helper.
- **Create** `lib/species.test.ts` — catalog integrity checks.
- **Create** `lib/vogel.ts` — `GOLDEN`, `PX_PER_CM`, `ROLE_RANK`, `ROLE_SPREAD` constants; `noise()`, `lerp()` helpers; `Composition`, `PlacedStem` types; `layout()` pure function.
- **Create** `lib/vogel.test.ts` — determinism test (same input → identical output) and a differentiation test (different `uid` → different placement).
- **Create** `store/bouquet.ts` — Zustand store: `stems`, `add(species)`, `remove(speciesId)`.
- **Create** `components/FlowerHead.tsx` — one illustrated SVG per `Shape` (8 shapes), gradient-shaded, `noise()`-jittered.
- **Create** `components/BouquetCanvas.tsx` — SVG stage: reads store, calls `layout()`, renders stems + `FlowerHead` + tie ribbon.
- **Create** `components/SpeciesCatalog.tsx` — role-grouped list with add/remove buttons, reads/writes the store.
- **Modify** `app/page.tsx` — replace Sprint 0 proof content with the catalog + canvas layout.
- **Create** `vitest.config.ts`, **Modify** `package.json` (add `zustand`, `vitest`, `vite-tsconfig-paths`, `"test"` script).

---

## Task 1: Species catalog + Vitest tooling

**Files:**
- Create: `lib/species.ts`
- Create: `lib/species.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `Role = 'focal' | 'secondary' | 'filler' | 'green'`, `Shape = 'peony' | 'dahlia' | 'ranun' | 'tulip' | 'umbel' | 'spray' | 'leaf' | 'spike'`, `interface Species { id: string; name: string; latin: string; role: Role; shape: Shape; color: string; lengthCm: number; headMm: number; wholesale: number; season: number[]; vaseDays: number; dry: boolean }`, `interface Stem { uid: number; species: Species }`, `SPECIES: Species[]`, `SPECIES_BY_ROLE: Record<Role, Species[]>`.

- [ ] **Step 1: Install dependencies**

```bash
npm install zustand
npm install -D vitest vite-tsconfig-paths
```

- [ ] **Step 2: Add Vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 3: Add the `test` script**

In `package.json`, inside `"scripts"`, add:

```json
"test": "vitest run"
```

- [ ] **Step 4: Write the failing test**

```ts
// lib/species.test.ts
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
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run lib/species.test.ts`
Expected: FAIL — `lib/species.ts` does not exist.

- [ ] **Step 6: Write `lib/species.ts`**

Colors below are OKLCH conversions of the prototype's hex catalog (`spiral-bouquet-prototype.jsx` `RAW_SPECIES`), computed via the standard sRGB→linear→OKLab→OKLCH pipeline — same method already used for `tokens/theme.css` in Sprint 0.

```ts
// lib/species.ts

export type Role = 'focal' | 'secondary' | 'filler' | 'green'
export type Shape = 'peony' | 'dahlia' | 'ranun' | 'tulip' | 'umbel' | 'spray' | 'leaf' | 'spike'

export interface Species {
  id: string
  name: string
  latin: string
  role: Role
  shape: Shape
  color: string
  lengthCm: number
  headMm: number
  wholesale: number
  season: number[]
  vaseDays: number
  dry: boolean
}

export interface Stem {
  uid: number
  species: Species
}

export const SPECIES: Species[] = [
  { id: 'peony',   name: 'Peonía',         latin: 'Paeonia lactiflora',     role: 'focal',     shape: 'peony',  color: 'oklch(0.794 0.0761 10.6)',  lengthCm: 65, headMm: 120, wholesale: 3.10, season: [4, 5, 6],                          vaseDays: 6,  dry: false },
  { id: 'dahlia',  name: 'Dalia',          latin: 'Dahlia pinnata',         role: 'focal',     shape: 'dahlia', color: 'oklch(0.7429 0.111 32.9)',  lengthCm: 60, headMm: 100, wholesale: 2.40, season: [7, 8, 9, 10],                       vaseDays: 5,  dry: false },
  { id: 'grose',   name: 'Rosa inglesa',   latin: 'Rosa × centifolia',      role: 'focal',     shape: 'peony',  color: 'oklch(0.9268 0.0222 63.2)', lengthCm: 60, headMm: 85,  wholesale: 2.80, season: [5, 6, 7, 8, 9],                     vaseDays: 7,  dry: false },
  { id: 'ranun',   name: 'Ranúnculo',      latin: 'Ranunculus asiaticus',   role: 'secondary', shape: 'ranun',  color: 'oklch(0.8319 0.0682 2.4)',  lengthCm: 45, headMm: 55,  wholesale: 1.60, season: [2, 3, 4, 5],                        vaseDays: 7,  dry: false },
  { id: 'tulip',   name: 'Tulipán',        latin: 'Tulipa gesneriana',      role: 'secondary', shape: 'tulip',  color: 'oklch(0.592 0.1809 27.6)',  lengthCm: 45, headMm: 55,  wholesale: 0.90, season: [1, 2, 3, 4, 11, 12],                vaseDays: 6,  dry: false },
  { id: 'anemone', name: 'Anémona',        latin: 'Anemone coronaria',      role: 'secondary', shape: 'ranun',  color: 'oklch(0.9601 0.0108 76.6)', lengthCm: 40, headMm: 60,  wholesale: 1.35, season: [1, 2, 3, 10, 11, 12],               vaseDays: 6,  dry: false },
  { id: 'wax',     name: 'Flor de cera',   latin: 'Chamelaucium uncinatum', role: 'filler',    shape: 'umbel',  color: 'oklch(0.7366 0.0995 0.9)',  lengthCm: 60, headMm: 100, wholesale: 1.10, season: [3, 4, 5, 6],                        vaseDays: 12, dry: true },
  { id: 'gyps',    name: 'Paniculata',     latin: 'Gypsophila paniculata',  role: 'filler',    shape: 'spray',  color: 'oklch(0.9778 0.0079 73.7)', lengthCm: 70, headMm: 140, wholesale: 0.85, season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 10, dry: true },
  { id: 'corn',    name: 'Aciano',         latin: 'Centaurea cyanus',       role: 'filler',    shape: 'umbel',  color: 'oklch(0.6626 0.1056 271)',  lengthCm: 50, headMm: 35,  wholesale: 0.95, season: [5, 6, 7, 8],                        vaseDays: 5,  dry: true },
  { id: 'euca',    name: 'Eucalipto',      latin: 'Eucalyptus cinerea',     role: 'green',     shape: 'leaf',   color: 'oklch(0.6933 0.04 141.5)',  lengthCm: 70, headMm: 130, wholesale: 1.20, season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 14, dry: true },
  { id: 'ruscus',  name: 'Rusco',          latin: 'Ruscus hypophyllum',     role: 'green',     shape: 'leaf',   color: 'oklch(0.5458 0.0659 139.7)', lengthCm: 60, headMm: 110, wholesale: 0.80, season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 21, dry: true },
  { id: 'bunny',   name: 'Cola de conejo', latin: 'Lagurus ovatus',         role: 'green',     shape: 'spike',  color: 'oklch(0.8452 0.0416 86.7)', lengthCm: 50, headMm: 45,  wholesale: 0.70, season: [6, 7, 8, 9],                        vaseDays: 30, dry: true },
]

export const SPECIES_BY_ROLE: Record<Role, Species[]> = {
  focal: SPECIES.filter((s) => s.role === 'focal'),
  secondary: SPECIES.filter((s) => s.role === 'secondary'),
  filler: SPECIES.filter((s) => s.role === 'filler'),
  green: SPECIES.filter((s) => s.role === 'green'),
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run lib/species.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts lib/species.ts lib/species.test.ts
git commit -m "feat: add species catalog and Vitest tooling"
```

---

## Task 2: Vogel-spiral layout engine

**Files:**
- Create: `lib/vogel.ts`
- Create: `lib/vogel.test.ts`

**Interfaces:**
- Consumes: `Stem` from `lib/species.ts` (`{ uid: number; species: Species }`).
- Produces: `GOLDEN: number`, `PX_PER_CM: number`, `noise(seed: number): number`, `lerp(a: number, b: number, t: number): number`, `interface Composition { density: number; tilt: number; rotation: number; jitter: number; spread: number }`, `interface PlacedStem extends Stem { n: number; x: number; y: number; r: number; depth: number; sortKey: number; scale: number; tone: number }`, `layout(stems: Stem[], params: Composition): PlacedStem[]`.

- [ ] **Step 1: Write the failing test**

```ts
// lib/vogel.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/vogel.test.ts`
Expected: FAIL — `lib/vogel.ts` does not exist.

- [ ] **Step 3: Write `lib/vogel.ts`**

Ported directly from `spiral-bouquet-prototype.jsx`'s `noise()`, `lerp()`, and `layout()` (lines 59-64 and 150-179), typed and stripped of anything React-specific. Math is unchanged — this is a straight port, not a redesign.

```ts
// lib/vogel.ts
import type { Stem, Role } from './species'

export const GOLDEN = (137.5 * Math.PI) / 180
export const PX_PER_CM = 2.8

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
  tilt: number
  rotation: number
  jitter: number
  spread: number
}

export interface PlacedStem extends Stem {
  n: number
  x: number
  y: number
  r: number
  depth: number
  sortKey: number
  scale: number
  tone: number
}

export function layout(stems: Stem[], { density, tilt, rotation, jitter, spread }: Composition): PlacedStem[] {
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
    const stemPx = stem.species.lengthCm * PX_PER_CM
    const x = r * Math.cos(theta)
    const y = r * sin * tilt - stemPx * (1 + jb * 0.05)

    return {
      ...stem,
      n,
      x,
      y,
      r,
      depth: sin,
      sortKey: r * sin,
      scale: 1 + sin * 0.16,
      tone: 0.72 + (sin + 1) * 0.14,
    }
  })

  return placed.sort((a, b) => a.sortKey - b.sortKey)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/vogel.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/vogel.ts lib/vogel.test.ts
git commit -m "feat: port Vogel-spiral layout engine"
```

---

## Task 3: Bouquet store

**Files:**
- Create: `store/bouquet.ts`

**Interfaces:**
- Consumes: `Species`, `Stem` from `lib/species.ts`.
- Produces: `useBouquetStore` Zustand hook exposing `{ stems: Stem[]; add(species: Species): void; remove(speciesId: string): void }`.

- [ ] **Step 1: Write `store/bouquet.ts`**

Ported from the prototype's `add`/`remove` handlers (lines 356-368), moved from `useState` into a Zustand store so both `SpeciesCatalog` and `BouquetCanvas` can read/write the same stem list without prop drilling.

```ts
// store/bouquet.ts
import { create } from 'zustand'
import type { Species, Stem } from '@/lib/species'

interface BouquetState {
  stems: Stem[]
  nextUid: number
  add: (species: Species) => void
  remove: (speciesId: string) => void
}

export const useBouquetStore = create<BouquetState>((set) => ({
  stems: [],
  nextUid: 1,
  add: (species) =>
    set((state) => ({
      stems: [...state.stems, { uid: state.nextUid, species }],
      nextUid: state.nextUid + 1,
    })),
  remove: (speciesId) =>
    set((state) => {
      const reversedIdx = [...state.stems].reverse().findIndex((s) => s.species.id === speciesId)
      if (reversedIdx === -1) return state
      const realIdx = state.stems.length - 1 - reversedIdx
      return { stems: state.stems.filter((_, i) => i !== realIdx) }
    }),
}))
```

- [ ] **Step 2: Verify strict TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add store/bouquet.ts
git commit -m "feat: add Zustand bouquet store"
```

---

## Task 4: Illustrated flower heads

**Files:**
- Create: `components/FlowerHead.tsx`

**Interfaces:**
- Consumes: `noise` from `lib/vogel.ts`; `Shape` from `lib/species.ts`.
- Produces: `FlowerHead({ shape, size, color, uid }: { shape: Shape; size: number; color: string; uid: number }): JSX.Element`.

This is the fidelity upgrade the two reference images drove (per this session's decision): each shape is now layered petals with a radial gradient per instance (not a flat fill) and `noise(uid + …)`-jittered rotation/scale per petal, instead of the prototype's flat opacity-stacked circles/ellipses (`spiral-bouquet-prototype.jsx` lines 183-257). All eight shapes are ported 1:1 in *identity* (same `shape` strings, same species-to-shape mapping) but re-illustrated.

- [ ] **Step 1: Write `components/FlowerHead.tsx`**

```tsx
// components/FlowerHead.tsx
import { noise } from '@/lib/vogel'
import type { Shape } from '@/lib/species'

interface FlowerHeadProps {
  shape: Shape
  size: number
  color: string
  uid: number
}

function petal(length: number, width: number): string {
  const hw = width / 2
  return `M0,0 C${-hw},${-length * 0.32} ${-hw * 0.75},${-length * 0.82} 0,${-length} C${hw * 0.75},${-length * 0.82} ${hw},${-length * 0.32} 0,0 Z`
}

function Gradient({ id, color }: { id: string; color: string }) {
  return (
    <radialGradient id={id} cx="36%" cy="30%" r="75%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
      <stop offset="48%" stopColor={color} />
      <stop offset="100%" stopColor={color} stopOpacity="0.82" />
    </radialGradient>
  )
}

function PetalRings({
  id,
  uid,
  rings,
}: {
  id: string
  uid: number
  rings: { count: number; length: number; width: number; radius: number; rotationOffset: number; opacity: number }[]
}) {
  return (
    <>
      {rings.map((ring, ringIdx) =>
        Array.from({ length: ring.count }, (_, i) => {
          const baseAngle = (i / ring.count) * 360 + ring.rotationOffset
          const jitterAngle = (noise(uid + ringIdx * 13 + i) - 0.5) * 14
          const jitterScale = 0.9 + noise(uid + ringIdx * 7 + i * 3) * 0.2
          return (
            <g key={`${ringIdx}-${i}`} transform={`rotate(${baseAngle + jitterAngle}) translate(0 ${-ring.radius}) scale(${jitterScale})`}>
              <path d={petal(ring.length, ring.width)} fill={`url(#${id})`} opacity={ring.opacity} />
            </g>
          )
        })
      )}
    </>
  )
}

export function FlowerHead({ shape, size: s, color, uid }: FlowerHeadProps) {
  const gradId = `fh-${shape}-${uid}`

  switch (shape) {
    case 'peony':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={color} />
          </defs>
          <PetalRings
            id={gradId}
            uid={uid}
            rings={[
              { count: 11, length: s * 0.5, width: s * 0.32, radius: s * 0.24, rotationOffset: 0, opacity: 0.9 },
              { count: 9, length: s * 0.4, width: s * 0.26, radius: s * 0.15, rotationOffset: 18, opacity: 0.94 },
              { count: 7, length: s * 0.3, width: s * 0.2, radius: s * 0.07, rotationOffset: 36, opacity: 1 },
            ]}
          />
          <circle r={s * 0.08} fill={color} opacity="0.55" />
          <circle r={s * 0.04} fill="#1c1f1a" opacity="0.3" />
        </g>
      )

    case 'dahlia':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={color} />
          </defs>
          <PetalRings
            id={gradId}
            uid={uid}
            rings={[
              { count: 14, length: s * 0.52, width: s * 0.14, radius: s * 0.2, rotationOffset: 0, opacity: 0.92 },
              { count: 10, length: s * 0.36, width: s * 0.12, radius: s * 0.1, rotationOffset: 12, opacity: 0.97 },
            ]}
          />
          <circle r={s * 0.09} fill="#fbf3e4" />
        </g>
      )

    case 'ranun':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={color} />
          </defs>
          <PetalRings
            id={gradId}
            uid={uid}
            rings={[
              { count: 8, length: s * 0.42, width: s * 0.3, radius: s * 0.18, rotationOffset: 0, opacity: 0.85 },
              { count: 8, length: s * 0.3, width: s * 0.24, radius: s * 0.09, rotationOffset: 22, opacity: 0.95 },
            ]}
          />
          <circle r={s * 0.07} fill="#1c1f1a" opacity="0.28" />
        </g>
      )

    case 'tulip':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={color} />
          </defs>
          <path
            d={`M ${-s * 0.34} ${s * 0.1} C ${-s * 0.38} ${-s * 0.5} ${-s * 0.12} ${-s * 0.6} 0 ${-s * 0.6} C ${s * 0.12} ${-s * 0.6} ${s * 0.38} ${-s * 0.5} ${s * 0.34} ${s * 0.1} C ${s * 0.2} ${s * 0.44} ${-s * 0.2} ${s * 0.44} ${-s * 0.34} ${s * 0.1} Z`}
            fill={`url(#${gradId})`}
          />
          <path
            d={`M 0 ${s * 0.08} L 0 ${-s * 0.52}`}
            stroke="#ffffff"
            strokeOpacity="0.3"
            strokeWidth={s * 0.03}
            strokeLinecap="round"
          />
        </g>
      )

    case 'umbel':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={color} />
          </defs>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 + noise(uid + i) * 1.4
            const d = s * (0.16 + noise(uid + i * 3) * 0.34)
            const r = s * (0.09 + noise(uid + i * 5) * 0.04)
            return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r} fill={`url(#${gradId})`} />
          })}
        </g>
      )

    case 'spray':
      return (
        <g opacity="0.95">
          <defs>
            <Gradient id={gradId} color={color} />
          </defs>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2 + noise(uid + i * 7) * 2
            const d = s * (0.12 + noise(uid + i) * 0.48)
            const r = s * 0.06
            return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r} fill={`url(#${gradId})`} />
          })}
        </g>
      )

    case 'leaf':
      return (
        <g transform={`rotate(${noise(uid) * 60 - 30})`}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <path
            d={`M 0 ${-s * 0.6} C ${s * 0.36} ${-s * 0.24} ${s * 0.36} ${s * 0.3} 0 ${s * 0.6} C ${-s * 0.36} ${s * 0.3} ${-s * 0.36} ${-s * 0.24} 0 ${-s * 0.6} Z`}
            fill={`url(#${gradId})`}
          />
          <line x1="0" y1={-s * 0.5} x2="0" y2={s * 0.5} stroke="#1c1f1a" strokeWidth="0.6" opacity="0.2" />
        </g>
      )

    case 'spike':
      return (
        <g transform={`rotate(${noise(uid) * 24 - 12})`}>
          <defs>
            <Gradient id={gradId} color={color} />
          </defs>
          {Array.from({ length: 7 }, (_, i) => {
            const t = i / 6
            const yOff = (t - 0.5) * s * 0.72
            const wisp = s * (0.16 - Math.abs(t - 0.5) * 0.1)
            return <ellipse key={i} cy={yOff} rx={wisp} ry={s * 0.22} fill={`url(#${gradId})`} opacity={0.85} />
          })}
        </g>
      )

    default:
      return <circle r={s * 0.4} fill={color} />
  }
}
```

- [ ] **Step 2: Verify strict TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add components/FlowerHead.tsx
git commit -m "feat: illustrated layered-petal flower heads"
```

---

## Task 5: Canvas, catalog panel, and page wiring

**Files:**
- Create: `components/BouquetCanvas.tsx`
- Create: `components/SpeciesCatalog.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useBouquetStore` from `store/bouquet.ts`; `layout`, `noise`, `PX_PER_CM` from `lib/vogel.ts`; `SPECIES_BY_ROLE`, `Role` from `lib/species.ts`; `FlowerHead` from `components/FlowerHead.tsx`.
- Produces: `BouquetCanvas(): JSX.Element`, `SpeciesCatalog(): JSX.Element`.

- [ ] **Step 1: Write `components/BouquetCanvas.tsx`**

Composition parameters are fixed constants here (not store state) — matching the "Cúpula" profile from the prototype (`tiltDeg: 62, spread: 0.55, jitter: 0.5`), the roundest/loosest of the prototype's three profiles and the closest match to both reference images' full, domed silhouette. Interactive sliders for these are Sprint 3/6 scope.

```tsx
// components/BouquetCanvas.tsx
'use client'

import { useMemo } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { layout, noise, PX_PER_CM } from '@/lib/vogel'
import { FlowerHead } from './FlowerHead'

const TILT_DEG = 62
const ROTATION_DEG = 0
const JITTER = 0.5
const SPREAD = 0.55

export function BouquetCanvas() {
  const stems = useBouquetStore((state) => state.stems)
  const tilt = Math.cos((TILT_DEG * Math.PI) / 180)

  const density = useMemo(() => {
    if (!stems.length) return 17
    const avgHeadPx = stems.reduce((sum, stem) => sum + (stem.species.headMm / 10) * PX_PER_CM, 0) / stems.length
    return Math.round(avgHeadPx * 0.86)
  }, [stems])

  const placed = useMemo(
    () => layout(stems, { density, tilt, rotation: (ROTATION_DEG * Math.PI) / 180, jitter: JITTER, spread: SPREAD }),
    [stems, density, tilt]
  )

  return (
    <svg viewBox="-200 -310 400 450" className="w-full h-auto" role="img" aria-label="Vista previa del ramo">
      {placed.length === 0 && (
        <text x="0" y="-110" textAnchor="middle" className="fill-muted font-display italic text-[14px]">
          Añade una flor focal para empezar
        </text>
      )}

      {placed.map((stem) => {
        const baseX = stem.x * 0.16
        const baseY = 74 + noise(stem.uid + 41) * 26
        return (
          <g key={stem.uid} style={{ opacity: stem.tone }}>
            <path
              d={`M 0 0 Q ${stem.x * 0.34} ${stem.y * 0.55} ${stem.x} ${stem.y}`}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={1.5 * stem.scale}
              strokeLinecap="round"
              opacity="0.75"
            />
            <line x1="0" y1="0" x2={baseX} y2={baseY} stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
            <g transform={`translate(${stem.x} ${stem.y}) scale(${stem.scale})`}>
              <FlowerHead shape={stem.species.shape} size={(stem.species.headMm / 10) * PX_PER_CM} color={stem.species.color} uid={stem.uid} />
            </g>
          </g>
        )
      })}

      {placed.length > 0 && (
        <g>
          <path d="M -12 -4 Q 0 2 12 -4" fill="none" stroke="#a8895e" strokeWidth="5" strokeLinecap="round" />
          <path d="M -12 2 Q 0 8 12 2" fill="none" stroke="#94794f" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}
```

- [ ] **Step 2: Write `components/SpeciesCatalog.tsx`**

```tsx
// components/SpeciesCatalog.tsx
'use client'

import { SPECIES_BY_ROLE, type Role } from '@/lib/species'
import { useBouquetStore } from '@/store/bouquet'

const ROLE_LABEL: Record<Role, string> = {
  focal: 'Focal',
  secondary: 'Secundaria',
  filler: 'Relleno',
  green: 'Verde',
}

const ROLES: Role[] = ['focal', 'secondary', 'filler', 'green']

export function SpeciesCatalog() {
  const stems = useBouquetStore((state) => state.stems)
  const add = useBouquetStore((state) => state.add)
  const remove = useBouquetStore((state) => state.remove)

  const counts: Record<string, number> = {}
  for (const stem of stems) {
    counts[stem.species.id] = (counts[stem.species.id] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      {ROLES.map((role) => (
        <div key={role}>
          <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted mb-2">{ROLE_LABEL[role]}</p>
          {SPECIES_BY_ROLE[role].map((sp) => (
            <div key={sp.id} className="flex items-center gap-2 py-1">
              <span className="w-4 h-4 rounded-full border border-line flex-none" style={{ background: sp.color }} />
              <span className="flex-1 min-w-0 leading-tight">
                <span className="block text-[12.5px] font-medium">{sp.name}</span>
                <span className="block font-display italic text-[10.5px] text-muted">{sp.latin}</span>
              </span>
              <button
                type="button"
                className="w-6 h-6 border border-line rounded disabled:opacity-30"
                onClick={() => remove(sp.id)}
                disabled={!counts[sp.id]}
                aria-label={`Quitar ${sp.name}`}
              >
                −
              </button>
              <span className="font-mono text-[11.5px] w-4 text-center text-muted">{counts[sp.id] ?? 0}</span>
              <button
                type="button"
                className="w-6 h-6 border border-line rounded"
                onClick={() => add(sp)}
                aria-label={`Añadir ${sp.name}`}
              >
                +
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `app/page.tsx`**

```tsx
// app/page.tsx
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { SpeciesCatalog } from '@/components/SpeciesCatalog'

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10">
      <h1 className="font-display text-2xl font-semibold mb-6">Monta tu ramo</h1>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <SpeciesCatalog />
        <div className="bg-surface border border-line rounded-xl p-4">
          <BouquetCanvas />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: all tests pass (species catalog + layout).

- [ ] **Step 5: Verify strict TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6: Verify production build**

Run: `npm run build`
Expected: succeeds.

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, open `http://localhost:3000`. Click `+` on a focal species (e.g. Peonía) — a layered-petal flower renders in the canvas, not a flat circle. Add several stems across roles — bouquet grows in a spiral, silhouette wider toward green/filler roles at the edges. Click `−` — the most recently added stem of that species is removed. Reload the page — canvas is empty again (no persistence yet, expected — store isn't wired to storage in Sprint 1).

- [ ] **Step 8: Commit**

```bash
git add components/BouquetCanvas.tsx components/SpeciesCatalog.tsx app/page.tsx
git commit -m "feat: wire compose UI - species catalog and bouquet canvas"
```

---

## Self-Review Notes

- **Spec coverage:** `lib/vogel.ts` (SPRINTS.md bullet 1) ✓ Task 2. `lib/species.ts` with 12 species (bullet 2) ✓ Task 1. `store/bouquet.ts` Zustand (bullet 3) ✓ Task 3. `components/BouquetCanvas.tsx` SVG (bullet 4) ✓ Task 5. Determinism unit test (bullet 5) ✓ Task 2. "Hecho cuando: se puede componer y el resultado es idéntico entre recargas" ✓ Task 5 step 7 (compose UI works; determinism is proven by the Task 2 unit test, since literal cross-reload persistence isn't in scope — no storage layer exists yet).
- **This session's two decisions:** raised FlowerHead fidelity ✓ Task 4 (gradients + layered petals replacing flat circles). UI chrome stays minimal, references saved for later ✓ Task 5 uses plain grouped list + bordered canvas panel, no bottom-sheet/editor styling.
- **Type consistency checked:** `Stem`/`Species` (Task 1) → consumed identically in `PlacedStem` (Task 2), `store/bouquet.ts` (Task 3), `FlowerHead` (Task 4 takes `shape/size/color/uid` matching `PlacedStem` fields), `BouquetCanvas` (Task 5, derives `size` the same way `layout()` derives `stemPx` — via `PX_PER_CM`, never hand-written).
