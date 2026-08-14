# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Pre-code. No `package.json`, no `src/` yet — only planning docs (`START.md`, `PRD.md`, `SCHEMA.md`, `SPRINTS.md`) and a throwaway React prototype (`spiral-bouquet-prototype.jsx`) that validates the composition engine. Sprint 0 (project scaffolding) has not been run. **Read `START.md` first** — it is the entry point and links the other three docs.

Once Sprint 0 lands, this file should be updated with real `npm run dev/build/lint/test` commands and file paths — don't invent them before they exist.

## What this is

TALLO (working name, unverified) — a web tool to compose a hand-tied bouquet and get a real shopping list (priced) and an assembly diagram (real measurements). No checkout, no accounts, no flower sales — it's a planning tool, not a store. Full problem/scope in `PRD.md`.

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

Sprint 4 (real photography replacing SVG) does not open until a 5-species normalization test passes — this is called out repeatedly as the project's main risk (see "Known risk" below and `PRD.md` §7). If a bouquet of 15 stems reads as a photo collage rather than one coherent shot, the answer is reverting to illustrated SVG and closing the topic, not iterating further on photography.

## Known risk — scope creep

Three extensions are explicitly tempting and explicitly deferred until after v1 ships: **care instructions, drying, and suggested combinations**. If you feel the pull to open one of these early, `START.md` calls this out directly as usually meaning there's an uncomfortable validation task being avoided — check the open-decisions list in `PRD.md` §6 before yielding.

## Open decisions blocking later phases

| Decision | Blocks |
|---|---|
| PNG asset source/pipeline (5-species trial before committing to 35) | Full visual phase (Sprint 4) |
| Final name — domain/trademark check | Branding/identity work |
| Florist questionnaire validating `BIND_RATIO`, `MAX_TILT`, hand-order | Credibility of the assembly diagram (Sprint 3) |
| Madrid florist margin sampling (8-10 shops) | Pricing accuracy (Sprint 2) |
