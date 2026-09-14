# Mobile-responsive UX — Design

Date: 2026-09-14
Status: approved (chat), pending spec review

## Objective

Bouquetier's builder (`/`) and export summary (`/export`) currently have no
real mobile layout — the only responsive handling in the codebase is
`page.tsx`'s `md:grid-cols-[260px_1fr]`, which just stacks the desktop
sidebar+canvas grid on narrow screens without redesigning it. This spec
covers building a real mobile layout for both screens, validated ahead of
time through a `/design`-skill exploration (6 structural directions, then 3
refinement rounds) published at
`https://claude.ai/artifact/AvK7gAuKNTioWQXpBXjoRX`. That canvas is
reference material for spacing/visual intent, not something this
implementation renders or depends on.

Two screens, one spec (implementation is phased — see the plan once
written): the mobile builder (bottom segmented control, permanent live
preview, swipeable category pages, nested horizontal species carousel) and
the mobile export summary (stacked shopping-list cards, validation
warnings, scaled assembly diagram, sticky export bar), reached directly
from the builder with no menu gate in between (real e-commerce
checkout-review pattern, not a Canva-style format-choice sheet — there is
no format choice to make here).

## Decisions already made (chat, this session)

- **Rendering strategy: dual-render, not a unified adaptive tree.** Every
  touched entry point gets a `md:hidden` block (new mobile JSX) alongside
  the existing `hidden md:block` desktop markup, left untouched. The two
  layouts are structurally too different (segmented control + full-bleed
  swipe vs. sidebar + grid) for one reflowing tree to stay readable —
  matches the project's existing `md:` convention (`page.tsx`,
  `export/page.tsx`) rather than introducing a new pattern.
- **Category swipe: native CSS scroll-snap, no new dependency.**
  `overflow-x: scroll; scroll-snap-type: x mandatory` on both the
  category-page level and the nested species-carousel level. Rejected: a
  carousel library (embla etc. — real control gain, but an unjustified new
  dependency for 4 fixed panels) and tap-only dots/arrows (loses the native
  swipe feel the mockups were built around).
- **`BouquetCanvas` is reused as-is for the mobile preview** — it's
  already `w-full h-auto`, viewBox-scaled, and self-contained (GSAP
  entrance/reflow animation, hydration-safe). No mobile-specific
  reimplementation of the bouquet rendering; only its container's
  size/position changes between breakpoints.
- **No new store, no URL state.** Active mobile category is local
  component `useState`, driven by an `IntersectionObserver` watching the
  scroll-snap panels. Everything else continues to read
  `useBouquetStore` exactly as desktop does.
- **Export entry point has no menu gate.** The mobile "Exportar" action
  navigates straight to `/export`'s mobile layout — no bottom-sheet
  chooser. Justification: Baymard's 2025 checkout-UX guidance ("avoid
  unnecessary navigation steps, keep essential actions sticky") for the
  review-before-committing pattern, versus Canva's export sheet, which
  earns its friction because it presents a real choice (PNG/PDF/quality) —
  Bouquetier's PNG export has no such choice, so gating it doesn't pay for
  itself. Share becomes a small icon button in the export header instead
  of its own menu entry.
- **Spec covers both screens; the plan phases them** (builder first, export
  second) rather than running two separate brainstorm→spec→plan cycles —
  the screens share tokens, store, and species data, so splitting the
  planning (not the implementation) would just duplicate context-setting
  for no isolation benefit.

## Architecture

```
app/page.tsx
├── hidden md:block  → existing SpeciesCatalog + BouquetCanvas grid (unchanged)
└── md:hidden        → components/mobile/MobileBouquetBuilder.tsx (new)

app/export/page.tsx → components/ExportView.tsx
├── ShoppingList.tsx          → existing <table> (hidden md:block) + new stacked-card list (md:hidden)
├── CompositionValidator.tsx  → warnings list already breakpoint-agnostic; only spacing/type adjust md:hidden if needed
├── AssemblyDiagram.tsx       → existing full SVG+list (hidden md:block) + new scaled SVG + truncated list (md:hidden)
└── ExportView.tsx            → new sticky md:hidden bottom action bar (ExportPngButton + Imprimir) + share icon in header
```

`MobileBouquetBuilder` is the one genuinely new component (the builder's
mobile structure has no desktop analog to extend in place); everything
else in `/export` is an addition inside components that already exist and
already compute the data a mobile view needs.

## `MobileBouquetBuilder.tsx`

- **Layout**: bottom segmented control (Focal/Secundaria/Relleno/Verde) +
  `BouquetCanvas` in a fixed-height preview zone above it that never
  collapses (matches the validated mockups — the bouquet stays on screen
  the whole time a stem is being added, across every category).
- **Category pages**: one `overflow-x-scroll snap-x snap-mandatory` flex
  row, one panel per role, all 4 mounted simultaneously (35 species total
  across all roles — no virtualization case here). Segmented-control tap
  and swipe both drive the same scroll position (`scrollIntoView` /
  `scrollTo` with `behavior: 'smooth'` on tap; native scroll on swipe); an
  `IntersectionObserver` on the panels is the single source of truth for
  "which category is active," so both input paths stay in sync without
  duplicated state.
- **Species carousel**: nested horizontal `overflow-x-scroll snap-x`
  row per panel, filtered from `SPECIES_BY_ROLE[role]` (existing
  `lib/species.ts` export) — same data desktop's `SpeciesCatalog` reads,
  no new derivation.
- **Add/remove**: calls `useBouquetStore`'s existing `add`/`remove`
  actions directly — same two calls `SpeciesCatalog` already makes, no
  shared hook extraction needed for two call sites this small.

## Data flow

No new state containers. `useBouquetStore` (Zustand, existing) remains the
single source of truth for `stems`; mobile components read/write it
exactly like their desktop counterparts. The only new state is the
category-swipe UI position, which is transient, per-component, and never
needs to persist or be shared — plain `useState` fed by
`IntersectionObserver`, not the store.

## Testing

Vitest is already configured. New coverage:

- `MobileBouquetBuilder`: `IntersectionObserver`-driven category-state
  transitions (mock the observer, assert active category updates and that
  tapping the segmented control scrolls to the right panel).
- Dual-render regression: existing desktop tests for `page.tsx` and
  `/export` continue to pass unmodified — the `hidden md:block` blocks are
  the exact markup those tests already cover, so this is mostly "did I
  break the existing test" rather than new assertions.
- No visual/screenshot testing — out of scope, matches the project's
  existing test style (behavioral, not pixel).

## Out of scope

- Any change to `BouquetCanvas`, `lib/vogel.ts`, or the desktop layout
  files' `hidden md:block` branches beyond adding them.
- GSAP entrance-animation parity for the mobile carousel cards — ships
  static first; motion polish is a follow-up, not blocking this plan.
- The `/design` canvas itself (`https://claude.ai/artifact/AvK7gAuKNTioWQXpBXjoRX`)
  is not touched, read, or kept in sync by this implementation — it was
  exploration tooling, not a live source of truth.
