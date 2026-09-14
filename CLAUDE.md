# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Sprints 0-3 done: engine (`lib/vogel.ts`), typed catalog (`lib/species.ts`), Zustand store (`store/bouquet.ts`), `components/BouquetCanvas.tsx`, shopping list + assembly diagram + composition validator + `/export` route all shipped and in production. Sprint 4 (photo assets) **closed, not viable** (2026-09-10) — 5-species trial (peonía, dalia, amarilis, tulipán, eucalipto) was mounted as a 15-stem bouquet and read as a collage (amarilis's source photo was cropped far tighter than the other 4, dominating the composition). Reverted to SVG per `SPRINTS.md`'s own rule; `photo` removed from all 5 `lib/species.ts` entries, pipeline (`scripts/prepare-photo.mjs`, `docs/photo-pipeline.md`) and PNGs (`public/photos/`) kept in the repo as reference, not deleted. See `SPRINTS.md` for full sequence and `PRD.md` §6 for other open decisions.

```
npm run dev      # next dev --turbopack
npm run build    # next build --turbopack
npm run start
npm run lint     # eslint
npm run test     # vitest run
```

## What this is

Bouquetier (working name, unverified) — a web tool to compose a hand-tied bouquet and get a real shopping list (priced) and an assembly diagram (real measurements). No checkout, no accounts, no flower sales — it's a planning tool, not a store. Full problem/scope in `PRD.md`.

## Planned stack (Sprint 0)

```
Next.js 15 · React 19 · TypeScript strict
Tailwind v4 CSS-first · OKLCH tokens in tokens/theme.css
Zustand · nuqs · GSAP via useGSAP() from @gsap/react
Vercel
```

## Non-negotiable rules (from START.md)

- **Cream canvas, `#EDECE6`.** Fixed from the first commit. Dark background is the framework default and is wrong here — the product is flowers in light. Don't touch it.
- **Real measurements, derived pixels.** Every species declares `lengthCm` and `headMm`. `PX_PER_CM` translates cm → px. Never hand-write a pixel size — derive it (see prototype lines 45-49 for the pattern: `stem = lengthCm * PX_PER_CM`, `head = (headMm / 10) * PX_PER_CM`).
- **Determinism.** Jitter comes from a sine-based `noise(uid)` hash, never `Math.random()`. Same bouquet (same `uid` sequence) must render pixel-identical on every reload.
- **GSAP discipline.** Only `useGSAP()` from `@gsap/react`. Centralize `registerPlugin` calls in `lib/gsap.ts`. Animate only `transform`/`opacity`/`clip-path`. Always gate behind `prefers-reduced-motion`.
- **Price is always a range**, never a single figure — the pricing model isn't precise enough to justify one, and a wrong exact number costs more credibility than an honest range.

## Composition engine (validated in prototype)

The core algorithm — port faithfully into `lib/vogel.ts` per `SPRINTS.md` Sprint 1, don't redesign it:

- **Vogel spiral / phyllotaxis placement**: `θ(n) = n · 137.5°` (golden angle), `r(n) = c · √n`. This is the same geometry a florist produces by hand when spiraling stems — it's why placement is algorithmic, not drag-and-drop. The user picks *what* to add; the system decides *where*.
- **2.5D projection**: `depth = sin(θ)` drives per-stem `scale`, opacity (`tone`), and paint order (`sortKey`), simulating rotation/depth/occlusion from flat sprites via a `tilt` factor — chosen over true 3D because the real cost isn't the engine, it's needing 35 3D-modeled species vs. 35 flat PNGs.
- **Density auto-tuning**: Vogel's constant neighbor-spacing `c` is set to `avgHeadPx * 0.86` by default, which self-controls bloom overlap — see `SCHEMA.md`'s `Composition.density`.
- **Role-driven silhouette**: `ROLE_SPREAD = { focal: 0.70, secondary: 0.93, filler: 1.15, green: 1.36 }` pushes each role progressively further from the axis so green breaks the outer contour.
- **Validator** (`validate()` in the prototype) checks: presence of a focal flower, odd focal count (reads more natural), role proportions against `ROLE_TARGET` bands, total stem count against `STEM_RANGE = [12, 24]`, and color-harmony clashes (saturated hues 60°-140° apart in hue-space — the "neither analogous nor complementary" dead zone). Port this logic, don't re-derive the thresholds.
- **Assembly diagram derivation**: `height = longestStemCm - TRIM_CM`, `bindFromTop = height * BIND_RATIO`, per-stem `cutCm` and `angleDeg` (scaled by `r / rMax` against `MAX_TILT`). `BIND_RATIO` (0.42) and `MAX_TILT` (38°) are marked **unvalidated** — Sprint 3 requires a professional florist questionnaire before trusting them further.
- **Pricing**: `unit = wholesale × seasonMultiplier(1.0 in-season / 2.4 out) × zoneMargin(2.4 periphery / 2.8 center / 3.2 Salamanca-Chamberí)`, then `range = [total × 0.85, total × 1.15]`. Margins are placeholders pending a Madrid florist sampling pass (Sprint 2).

Full type contracts (`Species`, `PlacedStem`, `Composition`, `ShoppingRow`, `AssemblyPlan`, `CompositionNote`) are defined in `SCHEMA.md` — treat it as the source of truth when porting the prototype's untyped JS into `lib/species.ts` / `lib/vogel.ts`.

## Sprint order (SPRINTS.md)

Strict sequence, no skipping ahead: **Sprint 0 (scaffold) → 1 (engine port) → 2 (35-species catalog) → 3 (shopping list + assembly output) → stop for asset validation → 4 (photo assets) → 5 (share via URL) → 6 (polish)**.

Sprint 4 (real photography replacing SVG) ran its 5-species normalization test and **failed it** — reverted to illustrated SVG, topic closed per the project's own rule (see "Known risk" below and `PRD.md` §7). Don't re-open photo mode without a new decision from the user; the pipeline stays in the repo but is inactive.

## Known risk — scope creep

Three extensions are explicitly tempting and explicitly deferred until after v1 ships: **care instructions, drying, and suggested combinations**. If you feel the pull to open one of these early, `START.md` calls this out directly as usually meaning there's an uncomfortable validation task being avoided — check the open-decisions list in `PRD.md` §6 before yielding.

## Open decisions blocking later phases

| Decision | Blocks |
|---|---|
| ~~PNG asset source/pipeline~~ — resolved 2026-09-10: 5-species trial failed (collage), reverted to SVG, Sprint 4 closed | — |
| Final name — domain/trademark check | Branding/identity work |
| Florist questionnaire validating `BIND_RATIO`, `MAX_TILT`, hand-order | Credibility of the assembly diagram (Sprint 3) |
| Madrid florist margin sampling (8-10 shops) | Pricing accuracy (Sprint 2) |

## Agent skills

### Issue tracker

Issues live in GitHub Issues on MiguelPCO/Bouquetier, using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (`docs/CONTEXT.md` + `docs/adr/`). See `docs/agents/domain.md`.
