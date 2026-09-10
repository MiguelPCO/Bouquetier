# Sprint 6 (Pulido) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring Bouquetier to portfolio-ready polish — animated add/remove transitions, keyboard-accessible focus states, a fixed color-contrast failure, and a standalone written case study — so the project "se puede enseñar sin explicar nada" (SPRINTS.md).

**Architecture:** GSAP (`gsap` + `@gsap/react`) drives per-stem enter/exit/reflow transitions inside `BouquetCanvas`, which grows a thin "shadow state" (`displayStems`) ahead of the Zustand store so a removed stem stays mounted long enough to animate out. `BouquetSvg` gains one optional prop so it can hand GSAP a ref per stem without losing its purity (still zero hooks, still safe for `renderToStaticMarkup` in the OG route and PNG export). Accessibility and contrast fixes are small, independent CSS/token changes. The case study is a static markdown file, no new route.

**Tech Stack:** Next.js 15.5.23 (App Router), React 19, TypeScript strict, Tailwind v4, Zustand 5, Vitest, `gsap` + `@gsap/react` (new).

**Spec:** `SPRINTS.md` (Sprint 6 section) — no separate spec doc was written for this sprint (grilling + domain-modeling concluded it needs no ADR and no `CONTEXT.md` changes; this plan's Global Constraints below are the full record of what was decided).

## Global Constraints

- Real Lighthouse baseline (measured on `bouquet-gold-nu.vercel.app`, 2026-09-10): Performance 98, Accessibility 94, Best Practices 100, SEO 100, **CLS 0**. The sprint's "Lighthouse ≥95 / CLS<0.1" goal is already met except for one Accessibility audit (`color-contrast`). Do not add performance-optimization tasks beyond Task 5 (the contrast fix) — there is no measured problem to justify more.
- All interaction today is native `<button>` (confirmed, no drag/slider/custom widget anywhere in `components/`). Tab order and activation already work; the only real gaps are visual focus and the contrast fix.
- `BouquetSvg` (`components/BouquetSvg.tsx`) MUST stay a pure, hook-free component — it is rendered via `renderToStaticMarkup` both server-side (`app/api/og/route.ts`) and client-side (`lib/exportPng.ts`). Any GSAP/animation logic belongs in `BouquetCanvas`, never in `BouquetSvg` itself.
- `--color-accent: oklch(0.4449 0.0664 141)` (`#3F5D3A`) is the brand green — reuse it for focus rings, don't invent a new color.
- Reduced motion: `prefers-reduced-motion: reduce` must skip all GSAP tweens outright (jump to end state), not merely shorten them.
- `CASE_STUDY.md` goes at the repo root (next to `README.md`/`SPRINTS.md`), in Spanish, not as an app route — the user explicitly rejected a `/case-study` web page.
- Known, accepted simplification for the reflow animation (Task 3): only the flower head (`FlowerHead`, inner `<g>`) tweens position when a stem's spiral index shifts. The connecting stem line/curve (`<path d="M 0 0 Q ...">` in `BouquetSvg`) is not re-drawn per animation frame — it snaps to its final shape on the same render as the state change, same as today. This means during a reflow the line briefly points to the final spot while the flower head is still easing there. Redrawing the curve every GSAP tick was evaluated and rejected as disproportionate effort for a sprint scoped as "polish," not a new feature — do not attempt to fix this as part of this plan.

---

### Task 1: Install GSAP and let `BouquetSvg` hand out per-stem refs

**Files:**
- Modify: `package.json` (add `gsap`, `@gsap/react` to `dependencies`)
- Modify: `components/BouquetSvg.tsx`
- Modify: `components/BouquetSvg.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `BouquetSvgProps.getGroupRef?: (uid: number) => (el: SVGGElement | null) => void`. When provided, the per-stem `<g>` that wraps `<FlowerHead>` gets `ref={getGroupRef(stem.uid)}` and **omits** its static `transform` attribute (GSAP becomes the sole owner of that group's position/scale from then on). When omitted (current callers: `app/api/og/route.ts`, `lib/exportPng.ts`), behavior is unchanged — the `transform` attribute is still set exactly as today.

- [ ] **Step 1: Install dependencies**

```bash
npm install gsap @gsap/react
```

- [ ] **Step 2: Write the failing tests**

Add to `components/BouquetSvg.test.ts` (keep every existing test in the file as-is, add these two):

```ts
  it('omits the static transform when getGroupRef is provided (GSAP owns position instead)', () => {
    const markup = renderToStaticMarkup(
      BouquetSvg({ stems: [{ uid: 1, species: peonia }], getGroupRef: () => () => {} })
    )
    expect(markup).not.toMatch(/<g transform="translate/)
  })

  it('keeps the static transform when getGroupRef is omitted (server/export rendering)', () => {
    const markup = renderToStaticMarkup(BouquetSvg({ stems: [{ uid: 1, species: peonia }] }))
    expect(markup).toMatch(/<g transform="translate/)
  })
```

- [ ] **Step 3: Run tests to verify the new ones fail**

Run: `npm run test -- BouquetSvg`
Expected: the two new tests FAIL (current code always sets `transform`, there's no `getGroupRef` prop yet — TypeScript will also complain `getGroupRef` doesn't exist on `BouquetSvgProps`).

- [ ] **Step 4: Implement**

In `components/BouquetSvg.tsx`, update the props interface and the per-stem render:

```ts
interface BouquetSvgProps {
  stems: Stem[]
  /** CSS color for a background rect filling the viewBox. Omit for a transparent export. */
  background?: string
  /**
   * When provided, BouquetCanvas (the interactive, client-only view) uses this to grab a ref
   * to each stem's flower-head <g> and drives its position/scale with GSAP instead of the
   * static `transform` attribute below. Omitted by every other caller (the OG route, PNG
   * export) — BouquetSvg itself stays hook-free either way, this is just a ref pass-through.
   */
  getGroupRef?: (uid: number) => (el: SVGGElement | null) => void
}
```

Replace the flower-head `<g>` (currently `<g transform={translate(${stem.x} ${stem.y}) scale(${stem.scale})}>`) with:

```tsx
            <g
              ref={getGroupRef?.(stem.uid)}
              transform={getGroupRef ? undefined : `translate(${stem.x} ${stem.y}) scale(${stem.scale})`}
            >
              <FlowerHead shape={stem.species.shape} size={headPx(stem.species)} color={stem.species.color} uid={stem.uid} />
            </g>
```

And update the function signature: `export function BouquetSvg({ stems, background, getGroupRef }: BouquetSvgProps) {`.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- BouquetSvg`
Expected: PASS (all 7 tests: 5 existing + 2 new).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json components/BouquetSvg.tsx components/BouquetSvg.test.ts
git commit -m "feat: add gsap deps, let BouquetSvg hand out per-stem refs for animation"
```

---

### Task 2: Stem enter/exit diffing (pure logic, unit tested)

**Files:**
- Create: `lib/animationDiff.ts`
- Test: `lib/animationDiff.test.ts`

**Interfaces:**
- Consumes: nothing (pure, only `number[]` in).
- Produces: `diffStemUids(prevUids: number[], nextUids: number[]): { entering: number[]; exiting: number[] }` — used by Task 3's `BouquetCanvas`.

- [ ] **Step 1: Write the failing tests**

Create `lib/animationDiff.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { diffStemUids } from './animationDiff'

describe('diffStemUids', () => {
  it('finds uids present in next but not prev as entering', () => {
    expect(diffStemUids([1, 2, 3], [2, 3, 4]).entering).toEqual([4])
  })

  it('finds uids present in prev but not next as exiting', () => {
    expect(diffStemUids([1, 2, 3], [2, 3, 4]).exiting).toEqual([1])
  })

  it('returns empty arrays when nothing changed', () => {
    expect(diffStemUids([1, 2], [1, 2])).toEqual({ entering: [], exiting: [] })
  })

  it('handles going from empty to non-empty (initial add)', () => {
    expect(diffStemUids([], [1])).toEqual({ entering: [1], exiting: [] })
  })

  it('handles going from non-empty to empty (remove last stem)', () => {
    expect(diffStemUids([1], [])).toEqual({ entering: [], exiting: [1] })
  })

  it('preserves nextUids order in entering (order matters for animation sequencing)', () => {
    expect(diffStemUids([5], [10, 5, 3]).entering).toEqual([10, 3])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- animationDiff`
Expected: FAIL with "Cannot find module './animationDiff'"

- [ ] **Step 3: Implement**

Create `lib/animationDiff.ts`:

```ts
export interface StemDiff {
  entering: number[]
  exiting: number[]
}

/** Which stem uids were added or removed between two renders, by comparing their uid lists.
 *  Pulled out of BouquetCanvas so the "who changed" logic is unit-testable without a DOM or
 *  GSAP — the animation wiring that consumes this (Task 3) isn't. */
export function diffStemUids(prevUids: number[], nextUids: number[]): StemDiff {
  const prevSet = new Set(prevUids)
  const nextSet = new Set(nextUids)
  return {
    entering: nextUids.filter((uid) => !prevSet.has(uid)),
    exiting: prevUids.filter((uid) => !nextSet.has(uid)),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- animationDiff`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/animationDiff.ts lib/animationDiff.test.ts
git commit -m "feat: add pure stem enter/exit diffing for the reflow animation"
```

---

### Task 3: GSAP animation in `BouquetCanvas` (enter, exit, reflow, reduced motion)

**Files:**
- Modify: `components/BouquetCanvas.tsx`

**Interfaces:**
- Consumes: `BouquetSvg`'s `getGroupRef` prop (Task 1), `diffStemUids` (Task 2), `layout`/`autoDensity`/`DEFAULT_COMPOSITION` from `lib/vogel.ts` (already exported, unchanged), `useBouquetStore` (unchanged).
- Produces: nothing new for other files — `BouquetCanvas`'s exported signature (`export function BouquetCanvas()`) is unchanged, still imported the same way by `app/page.tsx`.

This task has no isolated unit test of its own: it's GSAP timing wired to real DOM refs, and `vitest.config.ts` runs with `environment: 'node'` (no DOM) — the same reason Sprint 5 didn't unit-test `FlowerHead`'s visual output. Verify it by running the dev server and watching it in a browser (Step 3 below), not by adding a fake Vitest DOM test for it.

- [ ] **Step 1: Replace `components/BouquetCanvas.tsx` in full**

```tsx
// components/BouquetCanvas.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useBouquetStore } from '@/store/bouquet'
import { BouquetSvg, BOUQUET_VIEWBOX } from './BouquetSvg'
import { layout, autoDensity, DEFAULT_COMPOSITION } from '@/lib/vogel'
import { diffStemUids } from '@/lib/animationDiff'
import type { Stem } from '@/lib/species'

gsap.registerPlugin(useGSAP)

// Same coordinate frame as BouquetSvg, so the empty state and the drawn bouquet occupy
// exactly the same box and the layout doesn't jump when the first stem is added.
const VIEWBOX = `${BOUQUET_VIEWBOX.x} ${BOUQUET_VIEWBOX.y} ${BOUQUET_VIEWBOX.width} ${BOUQUET_VIEWBOX.height}`
const TWEEN_DURATION = 0.25
const TWEEN_EASE = 'power2.out'

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mql.matches)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function BouquetCanvas() {
  const stems = useBouquetStore((state) => state.stems)
  const [displayStems, setDisplayStems] = useState<Stem[]>(stems)
  const groupRefs = useRef(new Map<number, SVGGElement>())
  // Stems already present in `stems` on first mount render at their final position with no
  // entrance tween (opening a shared link shouldn't animate the whole bouquet popping in) —
  // only stems added after that get the enter animation.
  const enteredUidsRef = useRef(new Set<number>(stems.map((s) => s.uid)))
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  const placed = useMemo(
    () => layout(displayStems, { ...DEFAULT_COMPOSITION, density: autoDensity(displayStems) }),
    [displayStems]
  )

  // Sync the store into displayStems. Additions land immediately (so their <g> mounts and can
  // be ref'd for the entrance tween in the effect below). Removals stay in displayStems, still
  // rendered, until their exit tween finishes — that's what lets a removed stem visibly shrink
  // away instead of vanishing the instant the store drops it.
  useEffect(() => {
    const { entering, exiting } = diffStemUids(
      displayStems.map((s) => s.uid),
      stems.map((s) => s.uid)
    )
    if (entering.length === 0 && exiting.length === 0) return

    if (entering.length > 0) {
      const newStems = stems.filter((s) => entering.includes(s.uid))
      setDisplayStems((prev) => [...prev, ...newStems])
    }

    if (exiting.length > 0) {
      if (reducedMotion) {
        for (const uid of exiting) enteredUidsRef.current.delete(uid)
        setDisplayStems(stems)
      } else {
        let pending = exiting.length
        const finishExit = (uid: number) => {
          enteredUidsRef.current.delete(uid)
          pending -= 1
          if (pending === 0) {
            setDisplayStems((prev) => prev.filter((s) => !exiting.includes(s.uid)))
          }
        }
        for (const uid of exiting) {
          const el = groupRefs.current.get(uid)
          if (!el) {
            finishExit(uid)
            continue
          }
          gsap.to(el, {
            scale: 0,
            opacity: 0,
            duration: TWEEN_DURATION,
            ease: 'power2.in',
            onComplete: () => finishExit(uid),
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stems])

  // Entrance + reflow. Fires whenever `placed` changes — including the render right after the
  // effect above grows displayStems, once the new stem's <g> actually exists in the DOM.
  useGSAP(
    () => {
      for (const stem of placed) {
        const el = groupRefs.current.get(stem.uid)
        if (!el) continue

        if (!enteredUidsRef.current.has(stem.uid)) {
          enteredUidsRef.current.add(stem.uid)
          gsap.set(el, {
            x: stem.x,
            y: stem.y,
            scale: reducedMotion ? stem.scale : 0,
            opacity: reducedMotion ? 1 : 0,
          })
          if (!reducedMotion) {
            gsap.to(el, { scale: stem.scale, opacity: 1, duration: TWEEN_DURATION, ease: TWEEN_EASE })
          }
        } else if (reducedMotion) {
          gsap.set(el, { x: stem.x, y: stem.y, scale: stem.scale })
        } else {
          gsap.to(el, { x: stem.x, y: stem.y, scale: stem.scale, duration: TWEEN_DURATION, ease: TWEEN_EASE })
        }
      }
    },
    { dependencies: [placed, reducedMotion], scope: containerRef }
  )

  return (
    <div ref={containerRef} className="w-full h-auto">
      {displayStems.length === 0 ? (
        <svg viewBox={VIEWBOX} className="w-full h-auto" role="img" aria-label="Vista previa del ramo">
          <text x="0" y="-110" textAnchor="middle" className="fill-muted font-display italic text-[14px]">
            Añade una flor focal para empezar
          </text>
        </svg>
      ) : (
        <BouquetSvg
          stems={displayStems}
          getGroupRef={(uid) => (el: SVGGElement | null) => {
            if (el) groupRefs.current.set(uid, el)
            else groupRefs.current.delete(uid)
          }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

Run: `npm run test`
Expected: PASS, same count as before this task plus Tasks 1-2's new tests. `BouquetCanvas` itself has no test file — this just confirms nothing else regressed (`store/bouquet.test.ts`, `components/BouquetSvg.test.ts`, etc.).

- [ ] **Step 3: Manual verification in the browser**

```bash
npm run dev
```

Open `http://localhost:3000`, then:
1. Add a stem (any species' `+` button) — confirm it scales+fades in (~250ms), doesn't just pop.
2. Add 2-3 more of a different role (e.g. a focal, then a filler) — confirm existing stems visibly ease to their new spiral position rather than jump.
3. Remove a stem (`−` button) — confirm it shrinks+fades out before disappearing, not an instant vanish.
4. Open Chrome DevTools → Rendering tab → "Emulate CSS media feature prefers-reduced-motion: reduce" → repeat add/remove — confirm stems appear/disappear instantly with no tween.
5. Reload the page with an existing bouquet in `localStorage` — confirm the bouquet appears immediately, with no entrance animation playing for the stems already there.

If any of these don't match, fix `BouquetCanvas.tsx` before proceeding — this is the core deliverable of the task.

- [ ] **Step 4: Commit**

```bash
git add components/BouquetCanvas.tsx
git commit -m "feat: animate stem enter/exit/reflow with GSAP, respect prefers-reduced-motion"
```

---

### Task 4: Visible focus ring

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `--color-accent` (already defined in `tokens/theme.css`, imported by `app/globals.css`).
- Produces: nothing consumed by later tasks — pure CSS, applies globally.

- [ ] **Step 1: Add the rule**

In `app/globals.css`, after the existing `body { ... }` block and before the `@media print` block, add:

```css
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

- [ ] **Step 2: Manual verification**

```bash
npm run dev
```

Open `http://localhost:3000`, press Tab repeatedly through the filter toggles, add/remove buttons, "Copiar enlace", "Exportar PNG", and the "Exportar →" link. Confirm every one shows a solid green (`#3F5D3A`) 2px ring with a small gap, and that clicking with a mouse does **not** show the ring (that's what `:focus-visible` — vs plain `:focus` — buys us).

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add brand-colored focus-visible ring for keyboard navigation"
```

---

### Task 5: Fix the `color-contrast` Lighthouse finding

**Files:**
- Modify: `lib/color.ts`
- Modify: `lib/color.test.ts`
- Modify: `tokens/theme.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: `contrastRatio(hexA: string, hexB: string): number` in `lib/color.ts`, exported for reuse (not currently consumed elsewhere, but kept exported alongside `oklchToHex` per the module's existing pattern — a private helper would need duplicating in tests).

The exact failing pair was measured directly (script run against the real `oklchToHex` implementation, not eyeballed): `--color-muted: oklch(0.5355 0.0143 125)` (`#6b6f66`) gives a contrast ratio of **4.337:1** against `--color-canvas` (`#EDECE6`) — below the WCAG AA threshold of 4.5:1 for normal text. Against `--color-surface` (`#FFFFFF`) it already passes at 5.133:1. Darkening only the OKLCH lightness (`L`) to **0.50** (same chroma `0.0143`, same hue `125`) gives `#61655c`, which passes both: **5.034:1** against canvas, **5.959:1** against surface.

- [ ] **Step 1: Write the failing tests**

Add to `lib/color.test.ts` (new `describe` block, after the existing `oklchToHex` one):

```ts
describe('contrastRatio', () => {
  it('gives the maximum ratio (21) for black vs white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('gives a ratio of 1 for identical colors', () => {
    expect(contrastRatio('#6b6f66', '#6b6f66')).toBeCloseTo(1, 5)
  })

  it('is order-independent', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#000000'), 5)
  })

  it("confirms the OLD --color-muted failed WCAG AA against --color-canvas (the bug Task 5 fixes)", () => {
    // tokens/theme.css BEFORE this task: --color-muted: oklch(0.5355 0.0143 125) => #6b6f66
    // tokens/theme.css: --color-canvas: oklch(0.9422 0.0081 97) => #edece6
    const oldMuted = oklchToHex('oklch(0.5355 0.0143 125)')
    expect(contrastRatio(oldMuted, '#edece6')).toBeLessThan(4.5)
  })

  it('confirms the NEW --color-muted passes WCAG AA (4.5:1) against both canvas and surface', () => {
    // tokens/theme.css AFTER this task: --color-muted: oklch(0.50 0.0143 125) => #61655c
    const newMuted = oklchToHex('oklch(0.50 0.0143 125)')
    expect(contrastRatio(newMuted, '#edece6')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(newMuted, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})
```

Also add the import at the top of `lib/color.test.ts`: change `import { oklchToHex } from './color'` to `import { oklchToHex, contrastRatio } from './color'`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- color`
Expected: FAIL — `contrastRatio` doesn't exist yet (TypeScript/import error).

- [ ] **Step 3: Implement `contrastRatio`**

Add to `lib/color.ts` (after `oklchToHex`):

```ts
function relativeLuminance(hex: string): number {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16) / 255
  const g = parseInt(n.slice(2, 4), 16) / 255
  const b = parseInt(n.slice(4, 6), 16) / 255
  const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}

/** WCAG 2.x contrast ratio between two `#rrggbb` hex colors, per the standard relative
 *  luminance formula. Order-independent; returns a value from 1 (identical) to 21 (black vs
 *  white). Used to verify token changes pass the 4.5:1 AA threshold for normal text. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA)
  const lumB = relativeLuminance(hexB)
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- color`
Expected: PASS (all `oklchToHex` tests + 5 new `contrastRatio` tests).

- [ ] **Step 5: Update the token**

In `tokens/theme.css`, change:

```css
  --color-muted:   oklch(0.5355 0.0143 125);  /* #6B6F66 */
```

to:

```css
  --color-muted:   oklch(0.50   0.0143 125);  /* #61655C — darkened from 0.5355 for WCAG AA contrast (Sprint 6) */
```

- [ ] **Step 6: Visual sanity check**

```bash
npm run build
```

Expected: clean build, no errors. (The color shift is subtle — `#6B6F66` to `#61655C` — this step just confirms nothing broke; there's no automated visual regression tooling in this repo to check the shade itself beyond the contrast-ratio tests already passing.)

- [ ] **Step 7: Commit**

```bash
git add lib/color.ts lib/color.test.ts tokens/theme.css
git commit -m "fix: darken --color-muted to pass WCAG AA contrast (Lighthouse color-contrast finding)"
```

---

### Task 6: Case study document + close out SPRINTS.md

**Files:**
- Create: `CASE_STUDY.md` (repo root)
- Modify: `SPRINTS.md`

**Interfaces:**
- Consumes: `docs/adr/0001-share-link-encoding-and-og-image.md` (linked, not modified), `docs/photo-pipeline.md` (linked, not modified).
- Produces: nothing consumed by other tasks — this is the last task.

- [ ] **Step 1: Write `CASE_STUDY.md`**

Create `CASE_STUDY.md` at the repo root with this content:

```markdown
# Bouquetier — caso de estudio

## El problema

Elegir flores para un ramo a mano es un problema de composición que casi nadie fuera del
oficio sabe resolver: cuántos tallos focales frente a relleno, qué proporción de verde,
cómo distribuirlos para que el resultado no se vea plano ni amontonado. Bouquetier es una
app que resuelve ese problema con un algoritmo — una espiral de Vogel (el mismo patrón que
usan los girasoles para acomodar sus semillas) — en vez de con prueba y error.

El usuario elige especies de un catálogo con datos reales (precio mayorista, temporada,
duración en jarrón), la app calcula la posición de cada tallo, y el resultado es
imprimible: lista de la compra con sustitución por temporada, diagrama de montaje con
ángulos y puntos de corte, y ahora también un enlace para compartirlo.

## Decisiones de diseño

**SVG paramétrico, no fotografía.** La primera versión de cada flor se dibujó a mano en
SVG — formas geométricas por especie (pétalos, radios, jitter aleatorio por semilla) en vez
de fotos reales. En el Sprint 4 se probó lo contrario: sustituir 5 especies por fotografías
normalizadas, para ver si el ramo se veía más realista. El resultado, con un ramo de prueba
de 15 tallos montado en la app real, fue negativo — una especie fotografiada en primer
plano dominaba visualmente sobre las demás, y el conjunto se veía incoherente comparado con
el resto del ramo, todavía en SVG. Se revirtió la decisión y se volvió a SVG puro en todo
el catálogo. El pipeline de normalización de fotos (`docs/photo-pipeline.md`) se dejó en el
repo como referencia, sin borrar, pero sin uso en producción.

**Enlaces compartibles sin cuentas.** Compartir un ramo no debía requerir registrarse ni
guardar nada en un servidor. El estado completo del ramo (qué especies, cuántas) vive
codificado en la propia URL (`?s=especie:cantidad,...`), y una imagen de vista previa
(Open Graph) se genera al vuelo a partir de ese mismo parámetro — así un enlace pegado en
WhatsApp muestra el ramo exacto sin que nadie tenga que abrir la app primero. El detalle
técnico de esa decisión está documentado en
[`docs/adr/0001-share-link-encoding-and-og-image.md`](docs/adr/0001-share-link-encoding-and-og-image.md).

**Pulido con intención, no por checklist.** Antes de animar nada o de perseguir una
puntuación de Lighthouse, se midió el estado real de la app en producción: ya cumplía el
objetivo de rendimiento (98/100) y de estabilidad visual (CLS 0) del sprint de pulido. El
único hallazgo real fue un contraste de color insuficiente en un tono de texto secundario,
así que el trabajo de este sprint se enfocó en lo que sí faltaba — transiciones al
añadir/quitar flores (con soporte para `prefers-reduced-motion`) y foco de teclado visible
— en vez de optimizar algo que ya funcionaba.

## Capturas

*(pendiente: agregar capturas del composer, la vista de exportación y un enlace
compartido abierto en otro dispositivo)*

## Stack técnico

- **Next.js 15** (App Router, Turbopack) + **React 19** + **TypeScript** en modo estricto
- **Tailwind CSS v4** (CSS-first), tokens de color en OKLCH (`tokens/theme.css`)
- **Zustand 5** para estado global, con persistencia en `localStorage`
- **nuqs** para sincronizar el estado del ramo con la URL (`?s=...`)
- **GSAP** (`@gsap/react`) para las transiciones de añadir/quitar flores
- **sharp** para rasterizar el SVG del ramo a PNG, tanto en la imagen Open Graph
  (`app/api/og/route.ts`) como en el export manual
- **Vitest** para los tests unitarios de la lógica de layout, catálogo, codificación de
  enlaces y contraste de color

## Decisiones documentadas

- [ADR 0001 — Codificación del enlace compartido e imagen Open Graph](docs/adr/0001-share-link-encoding-and-og-image.md)
- [Pipeline de normalización de fotos (Sprint 4, referencia — no está en uso)](docs/photo-pipeline.md)
- Roadmap completo de sprints: [`SPRINTS.md`](SPRINTS.md)
```

- [ ] **Step 2: Close out Sprint 6 in `SPRINTS.md`**

In `SPRINTS.md`, change the `## Sprint 6 · Pulido` section header and add a closing line, following the same pattern used for Sprint 4 (`## Sprint 4 · Assets — CERRADO, no viable`) and implicitly for Sprint 5 (no special marker needed there since it's not the last one). Since Sprint 6 is the last planned sprint, add a "Hecho." line matching Sprint 3's and Sprint 4's closing style, right after the existing `**Hecho cuando** se puede enseñar sin explicar nada.` line:

```markdown
**Hecho cuando** se puede enseñar sin explicar nada.

**Hecho.** Transiciones GSAP en añadir/quitar (con `prefers-reduced-motion`), foco de
teclado visible, fix de contraste WCAG AA, y [`CASE_STUDY.md`](CASE_STUDY.md) en la raíz
del repo.
```

- [ ] **Step 3: Commit**

```bash
git add CASE_STUDY.md SPRINTS.md
git commit -m "docs: add CASE_STUDY.md, close out Sprint 6 in SPRINTS.md"
```

---

## Self-Review Notes

- **Spec coverage:** all 5 grilled points covered — GSAP enter/exit/reflow (Task 3) + reduced-motion (Task 3) → point 1-2; focus-visible (Task 4) + `aria-pressed` → point 3 (this one turned out to already exist in `components/SpeciesCatalog.tsx:64,76`, confirmed by reading the file before writing this plan — no task needed for it, only the focus ring was actually missing); Lighthouse/CLS baseline already measured, only the contrast fix is real work (Task 5) → point 4; `CASE_STUDY.md` at root, Spanish, mixed content (Task 6) → point 5.
- **Placeholder scan:** no TBD/TODO in code steps. `CASE_STUDY.md`'s "Capturas" section intentionally has a placeholder line (screenshots can't be taken from inside a plan) — this is content the user fills in after the app is running, not a plan defect.
- **Type consistency:** `getGroupRef` signature matches between its Task 1 definition (`BouquetSvgProps`) and its Task 3 usage (`BouquetCanvas`) — `(uid: number) => (el: SVGGElement | null) => void` in both. `diffStemUids`'s `StemDiff` shape (`{ entering: number[]; exiting: number[] }`) matches between Task 2's definition and Task 3's destructuring (`const { entering, exiting } = diffStemUids(...)`).
