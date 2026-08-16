# Sprint 3 · Salidas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a printable export page — shopping list with seasonal substitution, composition validator, assembly diagram (cuts/angles/tie point/hand order), and browser-native print — for the Tallo bouquet composer.

**Architecture:** Three new pure-function lib modules (`shoppingList.ts`, `validator.ts`, `assembly.ts`) feed three new self-contained client components that each read `useBouquetStore` directly (same pattern as existing `SpeciesCatalog.tsx`/`BouquetCanvas.tsx`), composed on a new `/export` route. Two small existing-code fixes ride along: hoisting composition defaults out of `BouquetCanvas.tsx` so the diagram matches the canvas, and persisting the store so `/export` survives a reload.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Zustand (incl. `zustand/middleware` persist), Tailwind v4, Vitest. No new dependencies — print via `@media print` + `window.print()`.

**Spec:** `docs/superpowers/specs/2026-08-16-sprint-3-salidas-design.md`

## Global Constraints

- No new npm dependencies (spec: Architecture section).
- No PDF library — browser print only (spec: Non-goals).
- No dark mode — canvas token is light/cream only, per Sprint 0 rule.
- Language: Spanish UI copy, matching rest of app.
- No Playwright in this repo — automated tests are Vitest-only on `lib/*.ts`; component/page verification is manual browser check.
- `BIND_RATIO`, `MAX_TILT_DEG`, `HANDLE_CM` are disclosed estimates, not lab-verified — must say so in a code comment where each is defined.
- Imports: lib-to-lib uses relative paths (`./species`), components use `@/lib/...` / `@/store/...` — matches existing convention throughout the repo.
- The assembly diagram's angle and cut-length formulas were verified empirically against real `layout()` output before this plan was written (see Task 3) — do not substitute a different geometric approach without re-deriving and re-verifying golden values the same way.

---

### Task 1: Persist the bouquet store

**Files:**
- Modify: `store/bouquet.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `useBouquetStore` unchanged in shape (`stems`, `nextUid`, `add`, `remove`) — only its persistence behavior changes. No other task depends on this change's internals, but every task after it benefits: `/export` (Task 9) will survive a reload instead of showing the empty state.

**Why now, why here:** the export page's whole purpose is a page used standing in a shop — a mobile reload or tab eviction must not lose the bouquet. The store is currently in-memory only. `zustand/middleware`'s `persist` ships with the `zustand` package already in `package.json` — no new dependency.

- [ ] **Step 1: Add persist middleware**

Replace the full contents of `store/bouquet.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Species, Stem } from '@/lib/species'

interface BouquetState {
  stems: Stem[]
  nextUid: number
  add: (species: Species) => void
  remove: (speciesId: string) => void
}

export const useBouquetStore = create<BouquetState>()(
  persist(
    (set) => ({
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
    }),
    { name: 'tallo-bouquet' }
  )
)
```

The only changes from the current file: the `persist` import, and wrapping the existing store creator in `persist(..., { name: 'tallo-bouquet' })`. `add`/`remove` logic is untouched.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. On `/`, add a few stems. Reload the page (hard refresh). Confirm the stems are still there (check DevTools → Application → Local Storage → `tallo-bouquet` key exists with the stems). Confirm removing a stem still works and persists across reload too.

- [ ] **Step 4: Commit**

```bash
git add store/bouquet.ts
git commit -m "feat: persist bouquet store to localStorage so /export survives a reload"
```

---

### Task 2: Hoist `DEFAULT_COMPOSITION`, expose `theta` from `layout()`

**Files:**
- Modify: `lib/vogel.ts`
- Modify: `lib/vogel.test.ts`
- Modify: `components/BouquetCanvas.tsx`

**Interfaces:**
- Consumes: existing `Composition` interface in `lib/vogel.ts`.
- Produces:
  - `export const DEFAULT_COMPOSITION: Omit<Composition, 'density'>` — consumed by Task 8 (`AssemblyDiagram.tsx`) and already by `BouquetCanvas.tsx`. Shape: `{ tiltDeg: number; rotation: number; jitter: number; spread: number }`.
  - `PlacedStem.theta: number` (radians) — new field on the existing interface, consumed by Task 3 (`lib/assembly.ts`).

- [ ] **Step 1: Add `DEFAULT_COMPOSITION` and `theta` to `lib/vogel.ts`**

Add directly after the `Composition` interface definition:

```ts
export const DEFAULT_COMPOSITION: Omit<Composition, 'density'> = {
  tiltDeg: 62,
  rotation: 0,
  jitter: 0.5,
  spread: 0.55,
}
```

These four values are copied verbatim from the current `BouquetCanvas.tsx` constants (`TILT_DEG = 62`, `ROTATION_DEG = 0` converted to radians is still `0`, `JITTER = 0.5`, `SPREAD = 0.55`) — this is a hoist, not a behavior change.

Add `theta: number` to the `PlacedStem` interface:

```ts
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
```

In `layout()`, the returned object currently is:

```ts
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
```

Add `theta` to it (it's already computed earlier in the function body as `const theta = n * GOLDEN + rotation + ja * jitter * 0.9`):

```ts
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
```

- [ ] **Step 2: Write tests for both additions**

In `lib/vogel.test.ts`, update the import line from:

```ts
import { layout } from './vogel'
```

to:

```ts
import { layout, DEFAULT_COMPOSITION, GOLDEN } from './vogel'
```

Add two new tests inside the existing `describe('layout', ...)` block (after the golden-value test):

```ts
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
```

(`peony` is already defined at the top of this file from the existing tests, and `GOLDEN` is already exported by `lib/vogel.ts`.)

- [ ] **Step 3: Run tests to verify they pass**

Run: `npm test`
Expected: all existing tests plus the 2 new ones PASS.

- [ ] **Step 4: Update `BouquetCanvas.tsx` to use `DEFAULT_COMPOSITION`**

Replace:

```ts
import { layout, noise, headPx, autoDensity } from '@/lib/vogel'
import { FlowerHead } from './FlowerHead'

const TILT_DEG = 62
const ROTATION_DEG = 0
const JITTER = 0.5
const SPREAD = 0.55

export function BouquetCanvas() {
  const stems = useBouquetStore((state) => state.stems)

  const density = useMemo(() => autoDensity(stems), [stems])

  const placed = useMemo(
    () => layout(stems, { density, tiltDeg: TILT_DEG, rotation: (ROTATION_DEG * Math.PI) / 180, jitter: JITTER, spread: SPREAD }),
    [stems, density]
  )
```

with:

```ts
import { layout, noise, headPx, autoDensity, DEFAULT_COMPOSITION } from '@/lib/vogel'
import { FlowerHead } from './FlowerHead'

export function BouquetCanvas() {
  const stems = useBouquetStore((state) => state.stems)

  const density = useMemo(() => autoDensity(stems), [stems])

  const placed = useMemo(
    () => layout(stems, { ...DEFAULT_COMPOSITION, density }),
    [stems, density]
  )
```

- [ ] **Step 5: Verify no visual change**

Run: `npm run dev`, open `/`, add a few stems (e.g. peonía, tulipán, eucalipto), confirm the bouquet renders identically to before this change — this is a pure refactor, `ROTATION_DEG=0` produced `rotation=0` either way so numerically nothing changed.

- [ ] **Step 6: Commit**

```bash
git add lib/vogel.ts lib/vogel.test.ts components/BouquetCanvas.tsx
git commit -m "refactor: hoist DEFAULT_COMPOSITION, expose theta on PlacedStem"
```

---

### Task 3: `lib/assembly.ts` — cut lengths, angles, hand order

**Files:**
- Create: `lib/assembly.ts`
- Create: `lib/assembly.test.ts`

**Interfaces:**
- Consumes: `PlacedStem` type (with `.theta`, from Task 2) and `stemPx` from `./vogel` (both exported).
- Produces: `BIND_RATIO: number`, `MAX_TILT_DEG: number`, `HANDLE_CM: number`, `AssemblyStep` interface (`{ uid: number; speciesName: string; handOrder: number; angleDeg: number; cutCm: number; handleCm: number; leanDeg: number; exceedsMaxTilt: boolean }`), `buildAssemblyDiagram(placed: PlacedStem[]): AssemblyStep[]` — consumed by Task 8 (`AssemblyDiagram.tsx`).

**Why this formula and not the obvious-looking one:** an earlier draft of
this task used `atan2(y, x)` and `hypot(x, y)` on `PlacedStem`'s `x`/`y`,
reasoning that `(0,0)` is the tie point in `BouquetCanvas.tsx`'s SVG. That
reasoning was checked against real `layout()` output and is wrong: `y = r
· sin(θ) · tilt − stemPx(species) · (1 + jitter term)` conflates the
spiral silhouette offset with a full stem-length shift, so `hypot(x,y)`
mostly just re-recovers `stemPx(species)` (i.e., approximately the
catalog length again, not a "visible portion" to add a handle to), and
`atan2(y,x)` on that vector collapses toward -90° for nearly every stem
regardless of its actual spiral position, because the huge `-stemPx` term
dominates. The corrected version below sources the angle from `theta`
(the actual spiral azimuth `layout()` computes) and the cut length
directly from `Species.lengthCm` (the catalog's finished length — no
canvas-pixel math needed for it at all).

- [ ] **Step 1: Write the failing tests**

Create `lib/assembly.test.ts`. The `fixture()` values below (`r: 20`,
`theta` = one golden angle) and every expected number were verified by
actually running `layout()` for a single peonía with
`{ density: 20, tiltDeg: 0, rotation: 0, jitter: 0, spread: 0 }` — not
hand-derived:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/assembly.test.ts`
Expected: FAIL — `Cannot find module './assembly'`

- [ ] **Step 3: Implement `lib/assembly.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/assembly.test.ts`
Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/assembly.ts lib/assembly.test.ts
git commit -m "feat: add assembly diagram math - cut lengths, angles, hand order"
```

---

### Task 4: `lib/shoppingList.ts` — grouping, pricing, seasonal substitution

**Files:**
- Create: `lib/shoppingList.ts`
- Create: `lib/shoppingList.test.ts`

**Interfaces:**
- Consumes: `Species`, `Stem`, `Role`, `SPECIES`, `colorFamily` from `./species` (all already exported).
- Produces: `ShoppingListLine` interface (`{ speciesId: string; name: string; role: Role; count: number; unitPrice: number; subtotal: number; inSeason: boolean; substitutes: Species[] }`), `buildShoppingList(stems: Stem[], month?: number): ShoppingListLine[]`, `totalCost(lines: ShoppingListLine[]): number` — consumed by Task 5 (`ShoppingList.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `lib/shoppingList.test.ts`. Fixtures below use real catalog data (verified directly against `lib/species.ts`, not assumed) so every substitution/season assertion reflects the actual 35-species catalog:

```ts
import { describe, it, expect } from 'vitest'
import { buildShoppingList, totalCost } from './shoppingList'
import { SPECIES } from './species'

const tulipan = SPECIES.find((s) => s.id === 'tulipan')!
const peonia = SPECIES.find((s) => s.id === 'peonia')!

describe('buildShoppingList', () => {
  it('groups stems by species id and counts occurrences', () => {
    const list = buildShoppingList(
      [
        { uid: 1, species: tulipan },
        { uid: 2, species: tulipan },
        { uid: 3, species: peonia },
      ],
      1
    )
    expect(list.find((l) => l.speciesId === 'tulipan')!.count).toBe(2)
    expect(list.find((l) => l.speciesId === 'peonia')!.count).toBe(1)
  })

  it('computes subtotal as unitPrice times count', () => {
    const list = buildShoppingList(
      [
        { uid: 1, species: tulipan },
        { uid: 2, species: tulipan },
      ],
      1
    )
    const line = list.find((l) => l.speciesId === 'tulipan')!
    expect(line.unitPrice).toBe(3.44)
    expect(line.subtotal).toBeCloseTo(6.88, 6)
  })

  it('totalCost sums all line subtotals', () => {
    const list = buildShoppingList(
      [
        { uid: 1, species: tulipan },
        { uid: 2, species: peonia },
      ],
      1
    )
    expect(totalCost(list)).toBeCloseTo(3.44 + 1.5, 6)
  })

  it('returns no substitutes when the species is in season', () => {
    // tulipan season includes January
    const list = buildShoppingList([{ uid: 1, species: tulipan }], 1)
    expect(list[0]!.inSeason).toBe(true)
    expect(list[0]!.substitutes).toEqual([])
  })

  it('suggests an in-season same-role-and-color substitute when out of season', () => {
    // tulipan (secondary, rojo) is out of season in October; anemona (secondary, rojo) is in season then
    const list = buildShoppingList([{ uid: 1, species: tulipan }], 10)
    expect(list[0]!.inSeason).toBe(false)
    expect(list[0]!.substitutes.map((s) => s.id)).toEqual(['anemona'])
  })

  it('caps substitutes at 2, sorted by price closeness, when more than 2 candidates qualify', () => {
    // peonia (focal, rosa) out of season in October; dalia/rosa-inglesa/protea (focal, rosa) all in season then
    // price diffs from peonia (1.5): dalia 2.81, rosa-inglesa 6.93, protea 23.57 -> top 2 by closeness
    const list = buildShoppingList([{ uid: 1, species: peonia }], 10)
    expect(list[0]!.inSeason).toBe(false)
    expect(list[0]!.substitutes.map((s) => s.id)).toEqual(['dalia', 'rosa-inglesa'])
  })

  it('returns empty substitutes when no other species shares role and color family', () => {
    // orquidea-cymbidium is the only focal+verde species in the catalog
    const orchid = SPECIES.find((s) => s.id === 'orquidea-cymbidium')!
    const list = buildShoppingList([{ uid: 1, species: orchid }], 7)
    expect(list[0]!.inSeason).toBe(false)
    expect(list[0]!.substitutes).toEqual([])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/shoppingList.test.ts`
Expected: FAIL — `Cannot find module './shoppingList'`

- [ ] **Step 3: Implement `lib/shoppingList.ts`**

```ts
import type { Species, Stem, Role } from './species'
import { SPECIES, colorFamily } from './species'

export interface ShoppingListLine {
  speciesId: string
  name: string
  role: Role
  count: number
  unitPrice: number
  subtotal: number
  inSeason: boolean
  substitutes: Species[]
}

function suggestSubstitutes(species: Species, month: number): Species[] {
  const family = colorFamily(species)
  return SPECIES.filter(
    (candidate) =>
      candidate.id !== species.id &&
      candidate.role === species.role &&
      colorFamily(candidate) === family &&
      candidate.season.includes(month)
  )
    .sort((a, b) => Math.abs(a.wholesale - species.wholesale) - Math.abs(b.wholesale - species.wholesale))
    .slice(0, 2)
}

export function buildShoppingList(stems: Stem[], month = new Date().getMonth() + 1): ShoppingListLine[] {
  const counts = new Map<string, { species: Species; count: number }>()
  for (const stem of stems) {
    const entry = counts.get(stem.species.id)
    if (entry) entry.count += 1
    else counts.set(stem.species.id, { species: stem.species, count: 1 })
  }

  return Array.from(counts.values()).map(({ species, count }) => {
    const inSeason = species.season.includes(month)
    return {
      speciesId: species.id,
      name: species.name,
      role: species.role,
      count,
      unitPrice: species.wholesale,
      subtotal: species.wholesale * count,
      inSeason,
      substitutes: inSeason ? [] : suggestSubstitutes(species, month),
    }
  })
}

export function totalCost(lines: ShoppingListLine[]): number {
  return lines.reduce((sum, line) => sum + line.subtotal, 0)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/shoppingList.test.ts`
Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/shoppingList.ts lib/shoppingList.test.ts
git commit -m "feat: add shopping list with seasonal substitution"
```

---

### Task 5: `lib/validator.ts` — composition rule checks

**Files:**
- Create: `lib/validator.ts`
- Create: `lib/validator.test.ts`

**Interfaces:**
- Consumes: `Stem`, `colorFamily` from `./species` (already exported).
- Produces: `ValidationResult` interface (`{ rule: 'role-balance' | 'season' | 'color-clash'; message: string }` — no `level` field; every result this function produces is a warning by construction, so a constant-valued `level` would be a type that lies), `validateComposition(stems: Stem[], month?: number): ValidationResult[]` — consumed by Task 6 (`CompositionValidator.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `lib/validator.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/validator.test.ts`
Expected: FAIL — `Cannot find module './validator'`

- [ ] **Step 3: Implement `lib/validator.ts`**

```ts
import type { Stem } from './species'
import { colorFamily } from './species'

export interface ValidationResult {
  rule: 'role-balance' | 'season' | 'color-clash'
  message: string
}

export function validateComposition(stems: Stem[], month = new Date().getMonth() + 1): ValidationResult[] {
  if (stems.length === 0) return []

  const results: ValidationResult[] = []

  const hasFocal = stems.some((stem) => stem.species.role === 'focal')
  if (!hasFocal) {
    results.push({
      rule: 'role-balance',
      message: 'La composición no tiene ninguna flor focal.',
    })
  }

  const roleCounts = new Map<string, number>()
  for (const stem of stems) {
    roleCounts.set(stem.species.role, (roleCounts.get(stem.species.role) ?? 0) + 1)
  }
  for (const [role, count] of roleCounts) {
    if (count / stems.length > 0.7) {
      results.push({
        rule: 'role-balance',
        message: `El rol "${role}" representa más del 70% de los tallos.`,
      })
    }
  }

  const outOfSeason = stems.filter((stem) => !stem.species.season.includes(month))
  if (outOfSeason.length > 0) {
    const names = Array.from(new Set(outOfSeason.map((stem) => stem.species.name)))
    results.push({
      rule: 'season',
      message: `Fuera de temporada: ${names.join(', ')}.`,
    })
  }

  const families = new Set(stems.map((stem) => colorFamily(stem.species)))
  if (families.size > 4) {
    results.push({
      rule: 'color-clash',
      message: 'Más de 4 familias de color distintas — riesgo de sobrecarga visual.',
    })
  }

  return results
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/validator.test.ts`
Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/validator.ts lib/validator.test.ts
git commit -m "feat: add composition validator - role balance, season, color clash rules"
```

---

### Task 6: `components/ShoppingList.tsx`

**Files:**
- Create: `components/ShoppingList.tsx`

**Interfaces:**
- Consumes: `useBouquetStore` from `@/store/bouquet`, `buildShoppingList`/`totalCost` from `@/lib/shoppingList` (Task 4), `Role` type from `@/lib/species`.
- Produces: `ShoppingList` component — consumed by Task 9 (`ExportView.tsx`).

- [ ] **Step 1: Implement the component**

Create `components/ShoppingList.tsx`:

```tsx
'use client'

import { useMemo } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { buildShoppingList, totalCost } from '@/lib/shoppingList'
import type { Role } from '@/lib/species'

const ROLE_LABEL: Record<Role, string> = {
  focal: 'Focal',
  secondary: 'Secundaria',
  filler: 'Relleno',
  green: 'Verde',
}

const ROLES: Role[] = ['focal', 'secondary', 'filler', 'green']

export function ShoppingList() {
  const stems = useBouquetStore((state) => state.stems)
  const lines = useMemo(() => buildShoppingList(stems), [stems])
  const total = useMemo(() => totalCost(lines), [lines])

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">Lista de la compra</h2>
      {ROLES.map((role) => {
        const roleLines = lines.filter((line) => line.role === role)
        if (roleLines.length === 0) return null
        return (
          <div key={role}>
            <h3 className="text-[11px] font-medium text-muted mb-1">{ROLE_LABEL[role]}</h3>
            <table className="w-full text-[12.5px]">
              <tbody>
                {roleLines.map((line) => (
                  <tr key={line.speciesId} className="border-b border-line align-top">
                    <td className="py-1">
                      {line.name}
                      {!line.inSeason && <span className="ml-1.5 text-[10px] text-warn">fuera de temporada</span>}
                      {!line.inSeason && line.substitutes.length > 0 && (
                        <div className="text-[10.5px] text-muted italic">
                          Sustituto: {line.substitutes.map((s) => s.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-center w-10">{line.count}</td>
                    <td className="py-1 text-right w-16">{line.unitPrice.toFixed(2)}€</td>
                    <td className="py-1 text-right w-16">{line.subtotal.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      <p className="text-right font-medium text-[13px]">Total: {total.toFixed(2)}€</p>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/ShoppingList.tsx
git commit -m "feat: add ShoppingList component"
```

---

### Task 7: `components/CompositionValidator.tsx`

**Files:**
- Create: `components/CompositionValidator.tsx`

**Interfaces:**
- Consumes: `useBouquetStore` from `@/store/bouquet`, `validateComposition` from `@/lib/validator` (Task 5).
- Produces: `CompositionValidator` component — consumed by Task 9 (`ExportView.tsx`).

- [ ] **Step 1: Implement the component**

Create `components/CompositionValidator.tsx`:

```tsx
'use client'

import { useMemo } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { validateComposition } from '@/lib/validator'

export function CompositionValidator() {
  const stems = useBouquetStore((state) => state.stems)
  const warnings = useMemo(() => validateComposition(stems), [stems])

  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">Validación</h2>
      {warnings.length === 0 ? (
        <p className="text-[12.5px] text-muted italic">Sin avisos.</p>
      ) : (
        <ul className="space-y-1">
          {warnings.map((warning, i) => (
            <li key={i} className="text-[12.5px] text-warn border-l-2 border-warn pl-2">
              {warning.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/CompositionValidator.tsx
git commit -m "feat: add CompositionValidator component"
```

---

### Task 8: `components/AssemblyDiagram.tsx`

**Files:**
- Create: `components/AssemblyDiagram.tsx`

**Interfaces:**
- Consumes: `useBouquetStore` from `@/store/bouquet`; `layout`, `DEFAULT_COMPOSITION`, `autoDensity` from `@/lib/vogel` (Task 2); `buildAssemblyDiagram` from `@/lib/assembly` (Task 3).
- Produces: `AssemblyDiagram` component — consumed by Task 9 (`ExportView.tsx`).

- [ ] **Step 1: Implement the component**

Create `components/AssemblyDiagram.tsx`. Stems flagged `exceedsMaxTilt` render their line/label in the warn token color instead of ink, so the diagram visibly surfaces exactly what the florist questionnaire's angle question is meant to validate:

```tsx
'use client'

import { useMemo } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { layout, DEFAULT_COMPOSITION, autoDensity } from '@/lib/vogel'
import { buildAssemblyDiagram } from '@/lib/assembly'

export function AssemblyDiagram() {
  const stems = useBouquetStore((state) => state.stems)
  const density = useMemo(() => autoDensity(stems), [stems])
  const placed = useMemo(() => layout(stems, { ...DEFAULT_COMPOSITION, density }), [stems, density])
  const steps = useMemo(() => buildAssemblyDiagram(placed), [placed])
  const ordered = useMemo(() => [...steps].sort((a, b) => a.handOrder - b.handOrder), [steps])

  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">Diagrama de montaje</h2>
      <svg viewBox="-160 -160 320 320" className="w-full h-auto max-w-sm" role="img" aria-label="Diagrama de ángulos y cortes">
        <circle cx="0" cy="0" r="4" fill="var(--color-accent)" />
        {steps.map((step) => {
          const rad = (step.angleDeg * Math.PI) / 180
          const len = 90
          const x = len * Math.cos(rad)
          const y = len * Math.sin(rad)
          const labelX = x * 1.18
          const labelY = y * 1.18
          const lineColor = step.exceedsMaxTilt ? 'var(--color-warn)' : 'var(--color-ink)'
          return (
            <g key={step.uid}>
              <line x1="0" y1="0" x2={x} y2={y} stroke={lineColor} strokeWidth="1" opacity="0.7" />
              <text x={labelX} y={labelY} textAnchor="middle" className="text-[8px] font-mono" fill={lineColor}>
                {step.handOrder}
              </text>
              <text x={labelX} y={labelY + 10} textAnchor="middle" className="fill-muted text-[7px] font-mono">
                {step.cutCm}cm
              </text>
            </g>
          )
        })}
      </svg>
      <ol className="text-[11.5px] space-y-0.5">
        {ordered.map((step) => (
          <li key={step.uid} className={step.exceedsMaxTilt ? 'text-warn' : undefined}>
            {step.handOrder}. {step.speciesName} — corte {step.cutCm}cm, mango {step.handleCm.toFixed(1)}cm, ángulo{' '}
            {step.angleDeg.toFixed(0)}°
          </li>
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/AssemblyDiagram.tsx
git commit -m "feat: add AssemblyDiagram component"
```

---

### Task 9: `/export` route, `ExportView`, and print CSS

**Files:**
- Create: `components/ExportView.tsx`
- Create: `app/export/page.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useBouquetStore` from `@/store/bouquet`; `ShoppingList` (Task 6), `CompositionValidator` (Task 7), `AssemblyDiagram` (Task 8); Next.js `Link` from `next/link`.
- Produces: working `/export` route.

- [ ] **Step 1: Implement `ExportView`**

Create `components/ExportView.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useBouquetStore } from '@/store/bouquet'
import { ShoppingList } from './ShoppingList'
import { CompositionValidator } from './CompositionValidator'
import { AssemblyDiagram } from './AssemblyDiagram'

export function ExportView() {
  const stems = useBouquetStore((state) => state.stems)

  if (stems.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted">No hay tallos en el ramo.</p>
        <Link href="/" className="text-accent underline">
          Vuelve a montar tu ramo
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="no-print flex items-center justify-between">
        <Link href="/" className="text-accent underline text-[13px]">
          ← Volver
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-md border border-line text-[13px]"
        >
          Imprimir
        </button>
      </div>
      <ShoppingList />
      <CompositionValidator />
      <AssemblyDiagram />
    </div>
  )
}
```

- [ ] **Step 2: Implement the route**

Create `app/export/page.tsx`:

```tsx
// app/export/page.tsx
import { ExportView } from '@/components/ExportView'

export default function ExportPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6 no-print">Salida de impresión</h1>
      <ExportView />
    </main>
  )
}
```

- [ ] **Step 3: Add print CSS**

Append to `app/globals.css`:

```css
@media print {
  .no-print {
    display: none !important;
  }

  section {
    break-inside: avoid;
  }
}
```

- [ ] **Step 4: Add a link to `/export` from the home page**

In `app/page.tsx`, the composer needs a way to reach the export page. Replace:

```tsx
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { SpeciesCatalog } from '@/components/SpeciesCatalog'

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10">
      <h1 className="font-display text-2xl font-semibold mb-6">Monta tu ramo</h1>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
```

with:

```tsx
import Link from 'next/link'
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { SpeciesCatalog } from '@/components/SpeciesCatalog'

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Monta tu ramo</h1>
        <Link href="/export" className="text-accent underline text-[13px]">
          Exportar →
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
```

This is a direct string replacement — the old standalone `<h1>` line is fully absorbed into the new flex row (both blocks above end with the same `<div className="grid gap-6 md:grid-cols-[260px_1fr]">` line as trailing context), no duplicate heading results.

- [ ] **Step 5: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors, build succeeds

- [ ] **Step 6: Manual verification**

Run: `npm run dev`. On `/`, confirm the new "Exportar →" link appears without a duplicate heading. With zero stems, navigate to `/export` and confirm the empty state + back-link. Add several stems on `/` (mix of roles, at least one out-of-season species for the current month), click "Exportar →", confirm:
- Shopping list shows correct counts/prices/total, out-of-season badge + substitute names where applicable
- Validator shows relevant warnings (or "Sin avisos.")
- Diagram renders lines from a central tie point with hand-order numbers and cut lengths; if any stem is flagged `exceedsMaxTilt`, confirm it renders in the warn color
- "Imprimir" opens the print preview with the back-link/button hidden (`.no-print` working), and the three sections don't split awkwardly across pages — if they do, add `break-before: page` to the offending section's className in `app/globals.css`'s `@media print` block before committing
- Reload the page mid-session (Task 1's persistence) — confirm stems and the export page both survive

- [ ] **Step 7: Commit**

```bash
git add components/ExportView.tsx app/export/page.tsx app/globals.css app/page.tsx
git commit -m "feat: wire /export route with print-ready shopping list, validator, and assembly diagram"
```

---

### Task 10: Florist questionnaire doc + final verification

**Files:**
- Create: `docs/florist-questionnaire.md`

**Interfaces:**
- Consumes: nothing (standalone doc).
- Produces: nothing consumed by other tasks — this is the sprint's final, closing task.

- [ ] **Step 1: Write the questionnaire**

Create `docs/florist-questionnaire.md`:

```markdown
# Cuestionario de validación técnica — florista profesional

Pendiente de administrar a un profesional real. Preguntas listas para esa sesión.
`BIND_RATIO`, `MAX_TILT_DEG` y `HANDLE_CM` (en `lib/assembly.ts`) son
estimaciones de ingeniería sin validar hasta responder esto.

## Punto de atado y manejo

1. ¿Qué proporción del largo total del tallo sueles dejar como "mango"
   por debajo del atado, en un ramo de mano en espiral? (la app usa 22%
   del largo total como estimación, con un mínimo de 8cm)
2. ¿8cm es un mínimo razonable de mango para sujetar el ramo con una
   mano, o necesitas más margen?

## Ángulo e inclinación

3. La app calcula, para cada tallo, un ángulo aproximado de inclinación
   respecto a la vertical (comparando cuánto se abre hacia fuera en la
   silueta contra su propio largo) y lo marca si supera 45°. ¿Es 45° un
   techo razonable antes de que un tallo se vea forzado o corra riesgo de
   partirse?
4. ¿Ese ángulo depende del tipo de tallo (leñoso vs. herbáceo) más de lo
   que la app asume con un valor único?

## Orden de montaje

5. ¿El orden de inserción en espiral — focales primero, luego
   secundarias, relleno, verde al final — coincide con tu técnica, o
   inviertes el orden en algún punto?

## Validación general

6. Con un ramo real montado a partir de los datos de la app (largo,
   ángulo, orden), ¿el resultado es técnicamente correcto o señalarías
   errores concretos?
```

- [ ] **Step 2: Full test suite and build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all Vitest tests pass (existing + new from Tasks 2-5), no type errors, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add docs/florist-questionnaire.md
git commit -m "docs: add florist validation questionnaire for Sprint 3 assembly constants"
```
