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

No backend, no new dependencies. Everything client-side, same as the rest
of the app (Zustand store, in-memory, no persistence layer).

### Existing-code fix riding along

`BouquetCanvas.tsx` currently hardcodes `TILT_DEG = 62`, `ROTATION_DEG = 0`,
`JITTER = 0.5`, `SPREAD = 0.55` inline. The export page's assembly diagram
must reflect the *same* placement the canvas shows, or the printed diagram
won't match what the user built. Hoist these four into an exported
`DEFAULT_COMPOSITION: Composition` constant in `lib/vogel.ts`; both
`BouquetCanvas.tsx` and the new export page import it. This is a targeted
fix serving this sprint directly, not a drive-by refactor.

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
export type ValidationLevel = 'ok' | 'warn'

export interface ValidationResult {
  level: ValidationLevel
  rule: 'role-balance' | 'season' | 'color-clash'
  message: string
}

export function validateComposition(stems: Stem[], month?: number): ValidationResult[]
```

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
export const BIND_RATIO = 0.22   // estimate: handle length as fraction of visible stem length, unvalidated
export const MAX_TILT_DEG = 45   // estimate: informational angle ceiling, unvalidated
export const HANDLE_CM = 8       // estimate: minimum hand-grip length below tie point, unvalidated

export interface AssemblyStep {
  uid: number
  speciesName: string
  handOrder: number   // = PlacedStem.n, already computed by layout()
  angleDeg: number     // atan2(y, x) at the tie point, converted from radians
  cutCm: number        // visible length (origin→head, px→cm) + max(HANDLE_CM, visible * BIND_RATIO)
}

export function buildAssemblyDiagram(placed: PlacedStem[]): AssemblyStep[]
```

Key insight reused from `lib/vogel.ts`: `layout()` already places every
stem's flower head at `(x, y)` **relative to the hand/tie point at the
canvas origin** — the bezier stem path in `BouquetCanvas.tsx` already
draws `M 0 0 Q ... x y`, confirming `(0,0)` *is* the tie point in this
coordinate system. So `angleDeg` needs no new geometry, just
`atan2(y, x)` on the existing placed coordinates. `handOrder` is already
`placed[i].n` — the spiral insertion order `layout()` computes. Only
`cutCm` (physical stem length to cut, in real-world cm) and the two
disclosed constants are new.

`cutCm` formula: `visibleCm = Math.hypot(x, y) / PX_PER_CM`, then
`cutCm = visibleCm + Math.max(HANDLE_CM, visibleCm * BIND_RATIO)`.

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
  at `angleDeg`, labeled with `handOrder` and `cutCm`. Print-legible: labels
  outside the line endpoints, high-contrast ink-on-cream (existing tokens).
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
- `lib/assembly.test.ts` — `handOrder` matches input `n`; `angleDeg` matches
  `atan2` on known placed coordinates; `cutCm` golden value for a known
  `(x,y)` + the three constants (guards against silent constant drift,
  same pattern as Sprint 1's golden vogel test).
- One Playwright smoke test: seed `stems` in the store (via existing
  E2E seed helpers), navigate to `/export`, assert it renders without
  crash and shows non-empty shopping list / diagram content.

## Non-goals for this sprint

- No PDF library — browser print only, per approved decision.
- No persistence of the export page's own state — it's a pure read of
  the existing store.
- No physical florist validation — deferred, disclosed above.
- No budget/price editing on the export page — shopping list is
  read-only, sourced from `Species.wholesale`.
