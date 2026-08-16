# Sprint 3 · Salidas — Design

Date: 2026-08-16
Status: approved (chat), pending spec review

## Objective

Ship the printable output layer of the app: a shopping list with seasonal
substitution, a composition validator, an assembly diagram (cuts, angles,
tie point), and browser-native print export. Per SPRINTS.md, this closes
when "el PDF es legible en móvil y un profesional no encuentra errores de
técnica" — the professional check is out of reach for this session (see
Deferred below), so the bar for *this* sprint is: the four artifacts exist,
are correct given documented assumptions, and print cleanly.

## Scope decomposition

Four sequential pieces, each building on the prior:

1. Shopping list
2. Composition validator
3. Assembly diagram
4. Print export (packages 1–3)

Plus one non-code deliverable: a florist validation questionnaire.

## Deferred / explicitly out of reach

**"Cuestionario a florista profesional"** cannot be administered by an AI —
no physical florist in the loop this session. Same shape as Sprint 2's
`zoneMargin` gap. Resolution: draft the questionnaire as a real artifact
(`docs/florist-questionnaire.md`), and mark `BIND_RATIO` / `MAX_TILT` as
**estimates, unvalidated** in code comments and `lib/assembly.ts` docs.
Both constants get real, reasoned starting values (not placeholders) —
just not lab-verified. This is a disclosed limitation, not a skipped task.

## Architecture

```
app/export/page.tsx          new route, client component
components/ExportView.tsx    page-level composition + empty state + print button
components/ShoppingList.tsx
components/CompositionValidator.tsx
components/AssemblyDiagram.tsx
lib/shoppingList.ts          pure functions
lib/validator.ts             pure functions
lib/assembly.ts              pure functions + BIND_RATIO/MAX_TILT constants
docs/florist-questionnaire.md
```

No backend, no new dependencies.

### Existing-code fixes riding along

**Hoist composition defaults.** `BouquetCanvas.tsx` currently hardcodes
`TILT_DEG = 62`, `ROTATION_DEG = 0`, `JITTER = 0.5`, `SPREAD = 0.55`
inline. The export page's assembly diagram must reflect the *same*
placement the canvas shows, or the printed diagram won't match what the
user built. Hoist these four into an exported
`DEFAULT_COMPOSITION: Omit<Composition, 'density'>` constant in
`lib/vogel.ts`; both `BouquetCanvas.tsx` and the new export page import
it.

**Expose the spiral angle.** `layout()` computes `theta` internally
(`n * GOLDEN + rotation + jitter term`) but never returns it — `PlacedStem`
only exposes the derived `x`, `y`, `depth = sin(theta)`. The assembly
diagram needs the actual azimuth, not a value re-derived from `x`/`y`
(see Module: `lib/assembly.ts` below for why that reconstruction is
unsound). Add `theta: number` (radians) to `PlacedStem` and return it
from `layout()`. This is an additive field — existing consumers
(`BouquetCanvas.tsx`, all current tests) are unaffected.

**Persist the store.** The store is in-memory only (`store/bouquet.ts`),
which is fine for the composer page but breaks the export page's actual
use case: a printed/print-previewed page used standing in a shop, where a
mobile browser reload or tab eviction would hit `/export` with an empty
store and show "no hay tallos." Wrap the store in Zustand's `persist`
middleware (ships with `zustand`, already a dependency — no new package)
against `localStorage`, keyed `'tallo-bouquet'`. Persisted `Stem` objects
lose reference identity to the canonical `SPECIES` array after a
localStorage round-trip (plain deep clones), but nothing in the codebase
relies on that identity — every lookup compares by `species.id`, not
object reference — so this is safe. Standard caveat: the client will
render an empty store on first paint until `persist` rehydrates
client-side after mount (brief flash, not a hydration-mismatch error,
since the server-rendered and pre-rehydration client-rendered output are
identical — both start from the same empty default state).

## Data flow

`/export` reads `stems` from `useBouquetStore`. If `stems.length === 0`,
`ExportView` renders an empty state ("vuelve a / y añade tallos" + link
back to `/`) and skips the three derivations entirely.

Otherwise:

```ts
const placed = layout(stems, DEFAULT_COMPOSITION)
const list = buildShoppingList(stems)
const warnings = validateComposition(stems)
const diagram = buildAssemblyDiagram(placed)
```

Each derivation is independent — none depends on another's output — so
they can be computed in any order and each component owns its own
`useMemo`.

## Module: `lib/shoppingList.ts`

```ts
export interface ShoppingListLine {
  speciesId: string
  name: string
  role: Role
  count: number
  unitPrice: number
  subtotal: number
  inSeason: boolean
  substitutes: Species[]  // empty unless !inSeason
}

export function buildShoppingList(stems: Stem[], month?: number): ShoppingListLine[]
export function totalCost(lines: ShoppingListLine[]): number
```

`month` defaults to `new Date().getMonth() + 1` (same convention as
`filterSpecies` in `lib/species.ts`). Grouping: one line per distinct
`species.id` present in `stems`, `count` = occurrences.

**Substitution rule**: for an out-of-season line, find species where
`role` matches AND `colorFamily(candidate) === colorFamily(original)` AND
`candidate.season.includes(month)`, excluding the original itself, sorted
by `Math.abs(candidate.wholesale - original.wholesale)` ascending, capped
at 2 results. If no candidates satisfy all three constraints, `substitutes`
is `[]` (not an error — the list still shows the original with a warning
badge, no forced fallback).

## Module: `lib/validator.ts`

```ts
export interface ValidationResult {
  rule: 'role-balance' | 'season' | 'color-clash'
  message: string
}

export function validateComposition(stems: Stem[], month?: number): ValidationResult[]
```

No `level` field — every `ValidationResult` this function can produce is
a warning by construction (rules only ever push on firing), so a
`level: 'warn'` that never varies is a union type that lies. The "all
clear" state is the empty array, not a `level: 'ok'` entry.

Returns one entry **per rule that fires** (warnings only) — an empty array
means all clear, and the component renders a single "sin avisos" state for
that case rather than three separate "ok" rows. Rules:

- **role-balance**: warn if no `focal` stem present, or if one role is
  >70% of total stem count (both conditions checked independently — up to
  2 warnings from this rule in one call).
- **season**: warn once, naming every stem currently out of season for
  `month` (single aggregated message, not one per stem — avoids warning
  spam on a 20-stem bouquet with 3 out-of-season fillers).
- **color-clash**: warn if `new Set(stems.map(s => colorFamily(s.species))).size > 4`.

Rules apply independently of `buildShoppingList`'s substitution logic —
the validator flags the problem, the shopping list offers the fix. No
shared state between the two modules.

## Module: `lib/assembly.ts`

```ts
export const BIND_RATIO = 0.22   // estimate: handle length as fraction of the stem's total finished length, unvalidated
export const MAX_TILT_DEG = 45   // estimate: informational lean-angle ceiling from vertical, unvalidated
export const HANDLE_CM = 8       // estimate: minimum hand-grip length below the tie point, unvalidated

export interface AssemblyStep {
  uid: number
  speciesName: string
  handOrder: number      // = PlacedStem.n, already computed by layout()
  angleDeg: number       // spiral insertion azimuth, 0-360, from PlacedStem.theta
  cutCm: number          // finished stem length — Species.lengthCm, from the catalog
  handleCm: number       // handle length below the tie point
  leanDeg: number        // approximate outward lean from vertical
  exceedsMaxTilt: boolean
}

export function buildAssemblyDiagram(placed: PlacedStem[]): AssemblyStep[]
```

**This section was revised after the first draft below turned out to be
geometrically wrong — kept here because the reasoning matters for anyone
touching this module later.**

The first draft assumed `(0,0)` is the tie point and that `hypot(x, y)`
therefore gives the stem's visible length, with `atan2(y, x)` giving its
angle. Checked against real `layout()` output (peonía, `lengthCm: 55`):
`hypot(x,y)/PX_PER_CM ≈ 62cm` and `atan2(y,x) ≈ -90°` for nearly every
stem. Both are wrong, and for the same reason: `y = r·sin(θ)·tilt −
stemLenPx·(1 + jitter)` conflates the spiral silhouette offset with a
full-stem-length vertical shift, so `hypot(x,y)` mostly just recovers
`stemLenPx` (i.e., ≈ the catalog length again, not a "visible portion" of
it) plus noise, and `atan2` on that vector is dominated by the huge
negative `y` term rather than the spiral rotation — every stem's angle
collapses toward -90° regardless of where it actually sits in the spiral.
The old formula would have told a florist to cut a 55cm stem to 62cm.

Corrected model, in two independently-sourced pieces:

- **`angleDeg`** (spiral insertion azimuth — "which direction around the
  bunch does this stem go in"): this is exactly `theta`, which `layout()`
  already computes per stem as `n·GOLDEN + rotation + jitter term` — the
  golden-angle spiral rotation is the real hand-tying quantity (rotate the
  bunch ~137.5° between each insertion). Normalize
  `(theta * 180 / Math.PI) % 360` into `[0, 360)`.
- **`cutCm` / `handleCm`** (how long to cut the stem, and where the tie
  band falls on it): sourced directly from the catalog, not derived from
  canvas pixels. `cutCm = species.lengthCm` — the catalog's finished
  length is already the number a florist needs. `handleCm =
  Math.max(HANDLE_CM, cutCm * BIND_RATIO)` — the hand-grip portion below
  the tie point, floored at `HANDLE_CM` for short stems where the ratio
  alone would be ungrippable (e.g. ranúnculo, `lengthCm: 28` →
  `28 * 0.22 = 6.16cm`, floored to `8cm`).
- **`leanDeg` / `exceedsMaxTilt`** (this is what `MAX_TILT_DEG` actually
  gates — the first draft defined the constant and never used it):
  `leanDeg = atan2(stem.r, stemPx(stem.species)) * 180 / Math.PI` — the
  silhouette radius `r` (how far out this stem's head sits from center)
  against its own physical length (`stemPx`), giving a monotonic,
  physically-motivated approximation of how far outward the stem must
  lean to reach its assigned position: farther-out placements or shorter
  stems relative to their reach lean more. `exceedsMaxTilt = leanDeg >
  MAX_TILT_DEG`, surfaced in the diagram as a flagged stem — this is the
  concrete question the florist questionnaire's angle question is
  actually validating.
- **`handOrder`** is unchanged from the first draft — `placed[i].n`, the
  spiral insertion order `layout()` already computes.

Golden values (verified by running `layout()` for a single peonía,
`{ density: 20, tiltDeg: 0, rotation: 0, jitter: 0, spread: 0 }`, `n=1`):
`r = 20`, `theta = 2.399827721492203` rad, `angleDeg = 137.5`,
`stemPx(peonia) = 154`, `cutCm = 55`, `handleCm = 12.1`,
`leanDeg = 7.399594659887109`, `exceedsMaxTilt = false`.

## Components

- **`ShoppingList`** — role-grouped table (reuses `ROLE_LABEL` pattern
  from `SpeciesCatalog.tsx`): name, count, unit price, subtotal, running
  total. Out-of-season lines show a badge; substitute names render inline
  below the line (small, muted text — no expand/collapse interaction,
  consistent with the rest of the app avoiding modals for this kind of
  detail).
- **`CompositionValidator`** — renders `ValidationResult[]` as chips
  (warn = amber/accent-adjacent, matching existing token palette, no new
  colors). "Sin avisos." when array is empty.
- **`AssemblyDiagram`** — SVG, tie point at center (reuses viewBox
  conventions from `BouquetCanvas.tsx`), one radial line per `AssemblyStep`
  at `angleDeg`, labeled with `handOrder` and `cutCm`; an ordered list below
  restates each step as `handOrder. name — corte cutCm cm, ángulo angleDeg°`.
  Print-legible: labels outside the line endpoints, high-contrast
  ink-on-cream (existing tokens).
- **`ExportView`** — composes the three above, "Imprimir" button
  (`onClick={() => window.print()}`), back-link to `/`, empty state when
  `stems.length === 0`.

## Print

`@media print` block appended to `app/globals.css`:
- `.no-print { display: none }` on nav/buttons.
- `break-inside: avoid` on each of the three output sections; forced
  page break between shopping list and assembly diagram if both would
  split awkwardly (verified visually during implementation, not assumed
  up front).
- No dark-mode concern — canvas token is already light/cream, per
  Sprint 0's "no dark" rule.

## Testing

- `lib/shoppingList.test.ts` — grouping counts, subtotal math, substitute
  filtering (role+color+season match, price-distance sort, cap at 2,
  empty-array fallback when no candidates qualify).
- `lib/validator.test.ts` — each rule fires/doesn't fire at its threshold
  boundary (70% role split, >4 color families, in/out of season), empty
  stems → empty warnings.
- `lib/assembly.test.ts` — `handOrder` matches input `n`; golden values for
  `angleDeg`/`cutCm`/`handleCm`/`leanDeg` against the verified `layout()`
  output above (guards against silent constant or formula drift, same
  pattern as Sprint 1's golden vogel test); `handleCm` floor kicks in for
  short stems; `exceedsMaxTilt` fires past `MAX_TILT_DEG`.
- `lib/vogel.test.ts` — new test asserting `DEFAULT_COMPOSITION`'s shape,
  and that `layout()` returns the correct `theta` for a known stem.
- No Playwright in this repo (Vitest only — confirmed via `package.json`).
  Manual browser verification instead: dev server, add stems on `/`,
  navigate to `/export`, confirm list/validator/diagram render, confirm
  `window.print()` opens the print preview with `.no-print` elements
  hidden. Same verification pattern used at the end of Sprints 1 and 2.

## Non-goals for this sprint

- No PDF library — browser print only, per approved decision.
- No export-page-specific state — the export page is a pure read of the
  (now persisted) store; persistence lives in `store/bouquet.ts` and
  applies to the whole app, not something the export page owns.
- No physical florist validation — deferred, disclosed above.
- No budget/price editing on the export page — shopping list is
  read-only, sourced from `Species.wholesale`.
