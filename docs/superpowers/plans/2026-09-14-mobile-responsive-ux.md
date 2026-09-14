# Mobile-Responsive UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real mobile layout for the builder (`/`) and export summary (`/export`), replacing the current bare `md:grid-cols` stacking with the structure validated in the `/design` canvas exploration.

**Architecture:** Dual-render at every touched entry point — a new `md:hidden` mobile block alongside the existing `hidden md:block` desktop markup, which stays untouched. One genuinely new component (`MobileBouquetBuilder`, no desktop analog); everything else is an addition inside components that already exist and already compute the data a mobile view needs. Category-swipe state is local `useState` driven by a pure, unit-tested helper fed from a real `IntersectionObserver` — no new store, no new dependency.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4 (CSS-first, scroll-snap utilities built in), Zustand (existing `useBouquetStore`), Vitest (`environment: 'node'` — no jsdom, no `@testing-library/react` in this project; tests are pure-function only, matching every existing test in the repo).

**Spec:** `docs/superpowers/specs/2026-09-14-mobile-responsive-ux-design.md`

## Global Constraints

- Zero new npm dependencies (spec: "no new dependency" for the swipe mechanism; holds project-wide for this plan).
- `BouquetCanvas` (`components/BouquetCanvas.tsx`) is reused unmodified — do not edit it.
- No new Zustand store, no new URL/query state. Category-swipe position is component-local `useState`.
- Vitest environment is `node` (see `vitest.config.ts`) — no DOM in tests. Any new automated test must be a pure function test (no `render()`, no `document`), matching every existing test in `lib/*.test.ts`. New React components are exercised manually via the dev server, exactly like the untested `BouquetCanvas.tsx` and `SpeciesCatalog.tsx` already are.
- Role type is `'focal' | 'secondary' | 'filler' | 'green'` (`lib/species.ts`), Spanish labels are `Focal/Secundaria/Relleno/Verde` — reuse this exact mapping, don't invent new copy.
- Design tokens are Tailwind utilities generated from `tokens/theme.css`'s `@theme` block: `bg-canvas`, `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-accent`/`text-accent`, `text-warn`. Fonts: `font-display` (Fraunces), `font-mono` (Plex Mono), default body is Plex Sans (`app/globals.css`). Use these, not raw hex/oklch values.
- Store API is `useBouquetStore((s) => s.stems)`, `.add(species: Species)`, `.remove(speciesId: string)` (`store/bouquet.ts`) — `remove` takes a **species id string**, not a stem `uid`.

---

## File Structure

```
lib/
  categorySwipe.ts          (new)  — pure "which category panel is active" resolver
  categorySwipe.test.ts     (new)  — its test

components/
  mobile/
    MobileBouquetBuilder.tsx (new) — segmented control + preview + swipeable categories + carousel
  ShoppingList.tsx           (modify) — add md:hidden stacked-card block
  AssemblyDiagram.tsx        (modify) — shrink SVG on mobile via className, truncate the step list
  ExportView.tsx             (modify) — split action row: hidden md:flex inline (desktop) + md:hidden sticky bottom bar

app/
  page.tsx                  (modify) — dual-render: md:hidden → MobileBouquetBuilder, hidden md:grid → existing grid
```

---

### Task 1: `resolveActiveCategory` pure helper

**Files:**
- Create: `lib/categorySwipe.ts`
- Test: `lib/categorySwipe.test.ts`

**Interfaces:**
- Produces: `interface PanelVisibility { role: Role; intersectionRatio: number }` and `function resolveActiveCategory(panels: PanelVisibility[], previousActive: Role): Role` — Task 2's `MobileBouquetBuilder` calls this from its `IntersectionObserver` callback.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/categorySwipe.test.ts
import { describe, it, expect } from 'vitest'
import { resolveActiveCategory, type PanelVisibility } from './categorySwipe'

describe('resolveActiveCategory', () => {
  it('picks the panel with the highest intersection ratio', () => {
    const panels: PanelVisibility[] = [
      { role: 'focal', intersectionRatio: 0.1 },
      { role: 'secondary', intersectionRatio: 0.9 },
      { role: 'filler', intersectionRatio: 0 },
      { role: 'green', intersectionRatio: 0 },
    ]
    expect(resolveActiveCategory(panels, 'focal')).toBe('secondary')
  })

  it('keeps the previous active category when every panel reports zero ratio', () => {
    const panels: PanelVisibility[] = [
      { role: 'focal', intersectionRatio: 0 },
      { role: 'secondary', intersectionRatio: 0 },
      { role: 'filler', intersectionRatio: 0 },
      { role: 'green', intersectionRatio: 0 },
    ]
    expect(resolveActiveCategory(panels, 'secondary')).toBe('secondary')
  })

  it('breaks a tie in favor of the previous active category when it is among the tied panels', () => {
    const panels: PanelVisibility[] = [
      { role: 'focal', intersectionRatio: 0.5 },
      { role: 'secondary', intersectionRatio: 0.5 },
      { role: 'filler', intersectionRatio: 0 },
      { role: 'green', intersectionRatio: 0 },
    ]
    expect(resolveActiveCategory(panels, 'secondary')).toBe('secondary')
  })

  it('breaks a tie by taking the first tied panel when the previous active category is not among them', () => {
    const panels: PanelVisibility[] = [
      { role: 'focal', intersectionRatio: 0.5 },
      { role: 'secondary', intersectionRatio: 0.5 },
      { role: 'filler', intersectionRatio: 0 },
      { role: 'green', intersectionRatio: 0 },
    ]
    expect(resolveActiveCategory(panels, 'filler')).toBe('focal')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/categorySwipe.test.ts`
Expected: FAIL — `Cannot find module './categorySwipe'` (file doesn't exist yet).

- [ ] **Step 3: Write minimal implementation**

```typescript
// lib/categorySwipe.ts
import type { Role } from './species'

export interface PanelVisibility {
  role: Role
  intersectionRatio: number
}

/**
 * Given the current visibility ratio of each role panel (as reported by an
 * IntersectionObserver watching a scroll-snap container), returns which role should be
 * treated as "active." Ties and all-zero frames keep `previousActive` rather than picking
 * array order, so a symmetric mid-swipe frame — or a frame where the observer hasn't fired
 * yet — doesn't flicker the segmented control.
 */
export function resolveActiveCategory(panels: PanelVisibility[], previousActive: Role): Role {
  let best = panels[0]
  for (const panel of panels) {
    if (panel.intersectionRatio > best.intersectionRatio) best = panel
  }
  if (best.intersectionRatio === 0) return previousActive

  const tied = panels.filter((p) => p.intersectionRatio === best.intersectionRatio)
  if (tied.length > 1 && tied.some((p) => p.role === previousActive)) return previousActive
  return best.role
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/categorySwipe.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/categorySwipe.ts lib/categorySwipe.test.ts
git commit -m "feat: add resolveActiveCategory helper for mobile category swipe"
```

---

### Task 2: `MobileBouquetBuilder` component

**Files:**
- Create: `components/mobile/MobileBouquetBuilder.tsx`

**Interfaces:**
- Consumes: `useBouquetStore((s) => s.stems)`, `.add(species: Species)`, `.remove(speciesId: string)` (`@/store/bouquet`); `SPECIES_BY_ROLE: Record<Role, Species[]>` (`@/lib/species`); `BouquetCanvas` (`@/components/BouquetCanvas`, no props); `resolveActiveCategory`, `PanelVisibility` (`@/lib/categorySwipe`, Task 1).
- Produces: `export function MobileBouquetBuilder()` — a self-contained block, no props. Task 3 renders it with no arguments inside a `flex-1 min-h-0` parent (it fills `h-full`).

- [ ] **Step 1: Write the component**

```tsx
// components/mobile/MobileBouquetBuilder.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { useBouquetStore } from '@/store/bouquet'
import { SPECIES_BY_ROLE, type Role } from '@/lib/species'
import { resolveActiveCategory, type PanelVisibility } from '@/lib/categorySwipe'

const ROLE_ORDER: Role[] = ['focal', 'secondary', 'filler', 'green']

const ROLE_LABEL: Record<Role, string> = {
  focal: 'Focal',
  secondary: 'Secundaria',
  filler: 'Relleno',
  green: 'Verde',
}

export function MobileBouquetBuilder() {
  const stems = useBouquetStore((state) => state.stems)
  const add = useBouquetStore((state) => state.add)
  const remove = useBouquetStore((state) => state.remove)

  const [active, setActive] = useState<Role>('focal')
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef(new Map<Role, HTMLDivElement>())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ratios = new Map<Role, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const role = (entry.target as HTMLElement).dataset.role as Role
          ratios.set(role, entry.intersectionRatio)
        }
        const panels: PanelVisibility[] = ROLE_ORDER.map((role) => ({
          role,
          intersectionRatio: ratios.get(role) ?? 0,
        }))
        setActive((prev) => resolveActiveCategory(panels, prev))
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    for (const el of panelRefs.current.values()) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scrollToRole = useCallback((role: Role) => {
    panelRefs.current.get(role)?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const stem of stems) c[stem.species.id] = (c[stem.species.id] ?? 0) + 1
    return c
  }, [stems])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none h-[60vh] pt-1">
        <BouquetCanvas />
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
      >
        {ROLE_ORDER.map((role) => (
          <div
            key={role}
            data-role={role}
            ref={(el) => {
              if (el) panelRefs.current.set(role, el)
              else panelRefs.current.delete(role)
            }}
            className="flex-none w-full snap-start overflow-x-auto flex gap-3 px-4 pb-4"
          >
            {SPECIES_BY_ROLE[role].map((sp) => (
              <div
                key={sp.id}
                className="flex-none w-[100px] snap-start bg-surface border border-line rounded-2xl p-2.5 text-center"
              >
                <span
                  className="block w-10 h-10 rounded-full border border-line mx-auto mb-2"
                  style={{ background: sp.color }}
                />
                <span className="block text-[12px] font-medium">{sp.name}</span>
                <span className="block font-display italic text-[9.5px] text-muted mb-2">{sp.latin}</span>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    className="w-[22px] h-[22px] border border-line rounded disabled:opacity-30"
                    onClick={() => remove(sp.id)}
                    disabled={!counts[sp.id]}
                    aria-label={`Quitar ${sp.name}`}
                  >
                    −
                  </button>
                  <span className="font-mono text-[11px] w-3.5 text-center">{counts[sp.id] ?? 0}</span>
                  <button
                    type="button"
                    className="w-[22px] h-[22px] rounded bg-accent text-surface"
                    onClick={() => add(sp)}
                    aria-label={`Añadir ${sp.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex-none flex border-t border-line bg-surface px-2.5 py-2">
        {ROLE_ORDER.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => scrollToRole(role)}
            aria-pressed={active === role}
            className={`flex-1 text-center font-mono text-[10.5px] py-3 rounded-lg ${
              active === role ? 'bg-accent text-surface' : 'text-muted'
            }`}
          >
            {ROLE_LABEL[role]}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors referencing `MobileBouquetBuilder.tsx`.

(No automated render test — see Global Constraints. Manual verification happens once Task 3 wires this into `app/page.tsx`.)

- [ ] **Step 3: Commit**

```bash
git add components/mobile/MobileBouquetBuilder.tsx
git commit -m "feat: add MobileBouquetBuilder component"
```

---

### Task 3: Wire `MobileBouquetBuilder` into `app/page.tsx`

**Files:**
- Modify: `app/page.tsx:41-65` (the `Home` component's return statement)

**Interfaces:**
- Consumes: `MobileBouquetBuilder` (Task 2, `@/components/mobile/MobileBouquetBuilder`).

- [ ] **Step 1: Replace the `Home` component's return statement**

Current (`app/page.tsx:41-65`):

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10">
      <Suspense fallback={null}>
        <ShareLinkSync />
      </Suspense>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Monta tu ramo</h1>
        <div className="flex items-center gap-3">
          <CopyShareLinkButton />
          <ExportPngButton />
          <Link href="/export" className="text-accent underline text-[13px]">
            Exportar →
          </Link>
        </div>
      </div>
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

Replace with:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col md:block md:px-10 md:py-10">
      <Suspense fallback={null}>
        <ShareLinkSync />
      </Suspense>
      <div className="flex items-center justify-between px-5 pt-5 pb-3 md:px-0 md:pt-0 md:pb-6">
        <h1 className="font-display text-xl md:text-2xl font-semibold">Monta tu ramo</h1>
        <div className="hidden md:flex items-center gap-3">
          <CopyShareLinkButton />
          <ExportPngButton />
          <Link href="/export" className="text-accent underline text-[13px]">
            Exportar →
          </Link>
        </div>
        <Link href="/export" className="md:hidden text-accent underline text-[13px]">
          Exportar →
        </Link>
      </div>

      <div className="md:hidden flex-1 min-h-0">
        <MobileBouquetBuilder />
      </div>

      <div className="hidden md:grid gap-6 md:grid-cols-[260px_1fr]">
        <SpeciesCatalog />
        <div className="bg-surface border border-line rounded-xl p-4">
          <BouquetCanvas />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Add the import**

Add to the import block at the top of `app/page.tsx` (alongside the other `@/components/*` imports):

```tsx
import { MobileBouquetBuilder } from '@/components/mobile/MobileBouquetBuilder'
```

- [ ] **Step 3: Run the existing test suite**

Run: `npm test`
Expected: PASS — no existing test touches `app/page.tsx`'s JSX directly (see Global Constraints), so this step is a regression check on the rest of the suite (`lib/*`, `store/bouquet.test.ts`, `components/BouquetSvg*.test.ts`), not new coverage.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, open `http://localhost:3000` in a browser resized to ≤767px wide (or device emulation).
Verify:
- Segmented control shows 4 roles, Focal active by default.
- `BouquetCanvas` renders above it and stays visible while scrolling the category row.
- Swiping the category row left/right updates which segmented-control button is highlighted.
- Tapping a segmented-control button scrolls to that category.
- Tapping `+`/`−` on a species card updates the live bouquet preview and the stepper count.
- Resizing back to ≥768px shows the original desktop sidebar+grid layout, unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire MobileBouquetBuilder into the builder page"
```

---

### Task 4: Mobile shopping-list cards

**Files:**
- Modify: `components/ShoppingList.tsx:22-70` (the full return statement)

- [ ] **Step 1: Replace the return statement**

Current file is `components/ShoppingList.tsx` in full (lines 1-71, already read — see spec's Architecture section for context). Replace the `<table>` block and the code around it with:

```tsx
  return (
    <section className="space-y-3">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">Lista de la compra</h2>
      {ROLES.map((role) => {
        const roleLines = lines.filter((line) => line.role === role)
        if (roleLines.length === 0) return null
        return (
          <div key={role}>
            <h3 className="text-[11px] font-medium text-muted mb-1">{ROLE_LABEL[role]}</h3>

            <table className="hidden md:table w-full text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] text-muted text-left">
                  <th className="py-1 font-normal">Especie</th>
                  <th className="py-1 font-normal text-center w-10">Uds.</th>
                  <th className="py-1 font-normal text-right w-16">Precio</th>
                  <th className="py-1 font-normal text-right w-16">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {roleLines.map((line) => (
                  <tr key={line.speciesId} className="border-b border-line align-top">
                    <td className="py-1">
                      {line.name}
                      {!line.inSeason && <span className="ml-1.5 text-[10px] text-warn">fuera de temporada</span>}
                      {!line.inSeason && line.substitutes.length > 0 && (
                        <div className="text-[10.5px] text-muted italic">
                          {line.substitutes.length > 1 ? 'Sustitutos' : 'Sustituto'}:{' '}
                          {line.substitutes.map((s) => s.name).join(', ')}
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

            <div className="md:hidden bg-surface border border-line rounded-xl overflow-hidden divide-y divide-line">
              {roleLines.map((line) => (
                <div key={line.speciesId} className="flex items-center justify-between px-3 py-2.5">
                  <div>
                    <div className="text-[13px]">
                      {line.name} <span className="font-mono text-[10px] text-muted">×{line.count}</span>
                    </div>
                    {!line.inSeason && (
                      <div className="text-[10.5px] text-warn mt-0.5">
                        fuera de temporada
                        {line.substitutes.length > 0 &&
                          ` · ${line.substitutes.length > 1 ? 'sustitutos' : 'sustituto'}: ${line.substitutes
                            .map((s) => s.name)
                            .join(', ')}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-[12px] font-medium">{line.subtotal.toFixed(2)}€</div>
                    <div className="font-mono text-[9.5px] text-muted">{line.unitPrice.toFixed(2)}€/ud</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {lines.length === 0 ? (
        <p className="text-[12.5px] text-muted italic">No hay tallos en la lista.</p>
      ) : (
        <p className="text-right font-medium text-[13px]">Total: {total.toFixed(2)}€</p>
      )}
    </section>
  )
```

Everything above `return` (the `useMemo`s for `lines`/`total`, `ROLE_LABEL`, `ROLES`) is unchanged.

- [ ] **Step 2: Run the existing test suite**

Run: `npm test`
Expected: PASS — `lib/shoppingList.test.ts` covers `buildShoppingList`/`totalCost`, which this task doesn't touch; this is a regression check.

- [ ] **Step 3: Manual verification**

At `/export` with at least one stem added, resize ≤767px: shopping list renders as stacked cards per role (not a table); an out-of-season stem shows the amber note with its substitute. Resize ≥768px: original table returns.

- [ ] **Step 4: Commit**

```bash
git add components/ShoppingList.tsx
git commit -m "feat: add mobile stacked-card layout to ShoppingList"
```

---

### Task 5: Scale the assembly diagram and truncate its step list on mobile

**Files:**
- Modify: `components/AssemblyDiagram.tsx:15-52`

**Interfaces:**
- Consumes: `ordered` (the same `handOrder`-sorted array the component already computes from `buildAssemblyDiagram`) — no new data.

- [ ] **Step 1: Add the truncated list and resize the SVG**

In `components/AssemblyDiagram.tsx`, after the existing `const ordered = useMemo(...)` line, add:

```tsx
  const MOBILE_STEP_LIMIT = 6
  const visibleMobile = ordered.slice(0, MOBILE_STEP_LIMIT)
  const remainingMobile = ordered.length - visibleMobile.length
```

Change the `<svg>`'s `className` from `"w-full h-auto max-w-sm"` to:

```tsx
className="w-full h-auto max-w-[220px] mx-auto md:max-w-sm md:mx-0"
```

(The `viewBox` already makes this purely a display-size change — no coordinate math changes, so the SVG's internal `steps.map` loop stays exactly as it is.)

Replace the single `<ol>` at the end of the component with two:

```tsx
      <ol className="hidden md:block text-[11.5px] space-y-0.5">
        {ordered.map((step) => (
          <li key={step.uid} className={step.exceedsMaxTilt ? 'text-warn' : undefined}>
            {step.exceedsMaxTilt ? '⚠ ' : ''}
            {step.handOrder}. {step.speciesName} — corte {step.cutCm}cm, mango {step.handleCm.toFixed(1)}cm, ángulo{' '}
            {step.angleDeg.toFixed(0)}°
          </li>
        ))}
      </ol>
      <ol className="md:hidden text-[11.5px] space-y-0.5">
        {visibleMobile.map((step) => (
          <li key={step.uid} className={step.exceedsMaxTilt ? 'text-warn' : undefined}>
            {step.exceedsMaxTilt ? '⚠ ' : ''}
            {step.handOrder}. {step.speciesName} — corte {step.cutCm}cm, mango {step.handleCm.toFixed(1)}cm, ángulo{' '}
            {step.angleDeg.toFixed(0)}°
          </li>
        ))}
      </ol>
      {remainingMobile > 0 && (
        <p className="md:hidden font-mono text-[10px] text-muted mt-1.5">+ {remainingMobile} pasos más →</p>
      )}
```

- [ ] **Step 2: Run the existing test suite**

Run: `npm test`
Expected: PASS — `lib/assembly.test.ts` covers `buildAssemblyDiagram`, untouched by this task.

- [ ] **Step 3: Manual verification**

At `/export` with ≥7 stems added, resize ≤767px: diagram SVG is visibly smaller, step list shows only the first 6 with a "+N pasos más →" line below. Resize ≥768px: full SVG size and complete list return.

- [ ] **Step 4: Commit**

```bash
git add components/AssemblyDiagram.tsx
git commit -m "feat: scale assembly diagram and truncate step list on mobile"
```

---

### Task 6: Mobile sticky export action bar

**Files:**
- Modify: `components/ExportView.tsx` (full file, currently 46 lines)

**Interfaces:**
- Consumes: `CopyShareLinkButton` (`@/components/CopyShareLinkButton`, not currently imported in this file), `ExportPngButton` (already imported).

**Deviation from the spec's exact wording:** the spec describes "a share icon in the header." `CopyShareLinkButton` only renders its own hardcoded text button (`"Copiar enlace"` / `"¡Copiado!"`) with no icon-only variant or `className` override — giving it one would mean modifying a working, already-tested component for a cosmetic difference alone. This task instead puts the real `CopyShareLinkButton` in the mobile sticky bottom bar next to `ExportPngButton`/Imprimir, matching the "no menu gate, actions live where the summary already is" intent without touching that component. If a compact icon-only share control is wanted later, that's a follow-up to `CopyShareLinkButton` itself, not this plan.

- [ ] **Step 1: Replace the file**

```tsx
'use client'

import Link from 'next/link'
import { useBouquetStore } from '@/store/bouquet'
import { ShoppingList } from './ShoppingList'
import { CompositionValidator } from './CompositionValidator'
import { AssemblyDiagram } from './AssemblyDiagram'
import { ExportPngButton } from './ExportPngButton'
import { CopyShareLinkButton } from './CopyShareLinkButton'

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
    <div className="space-y-8 pb-24 md:pb-0">
      <div className="no-print flex items-center justify-between">
        <Link href="/" className="text-accent underline text-[13px]">
          ← Volver
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <CopyShareLinkButton />
          <ExportPngButton />
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-md border border-line text-[13px]"
          >
            Imprimir
          </button>
        </div>
      </div>
      <ShoppingList />
      <CompositionValidator />
      <AssemblyDiagram />

      <div className="no-print md:hidden fixed inset-x-0 bottom-0 flex gap-2 px-4 py-3 border-t border-line bg-surface">
        <CopyShareLinkButton />
        <ExportPngButton />
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-md border border-line text-[13px]"
        >
          Imprimir
        </button>
      </div>
    </div>
  )
}
```

The only behavioral changes from the current file: the top action row is `hidden md:flex` instead of always-`flex`; a `pb-24 md:pb-0` was added to the outer wrapper so the new fixed bottom bar doesn't cover the diagram's last rows on mobile; and the new `md:hidden` fixed bottom bar repeats the same three real actions.

- [ ] **Step 2: Run the existing test suite**

Run: `npm test`
Expected: PASS — no existing test imports `ExportView`.

- [ ] **Step 3: Manual verification**

At `/export` with stems added, resize ≤767px: top row shows only "← Volver"; a bottom bar with "Copiar enlace" / "Exportar PNG" / "Imprimir" stays pinned while scrolling; tapping each performs its real action (native share sheet or clipboard copy, PNG download, browser print dialog). Resize ≥768px: bottom bar disappears, the original inline top-right button row returns.

- [ ] **Step 4: Commit**

```bash
git add components/ExportView.tsx
git commit -m "feat: add mobile sticky export action bar"
```

---

### Task 7: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS, all suites (this is the same command as every prior task's Step — running it once more here is the final gate after all 6 tasks are in).

- [ ] **Step 2: Run the type checker**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Full manual walkthrough**

With the dev server running (`npm run dev`), at a mobile viewport width (≤767px):
1. Build a bouquet on `/` using the mobile builder (add stems from at least 3 different roles, including at least one out-of-season species if the current month allows it).
2. Tap "Exportar →" — lands directly on `/export`'s mobile layout, no intermediate menu.
3. Verify the shopping-list cards, validation warnings, and assembly diagram all reflect the exact bouquet just built.
4. Tap "Exportar PNG" in the sticky bar — a PNG downloads.
5. Widen the browser to ≥768px on both `/` and `/export` — desktop layouts render exactly as they did before this plan (sidebar+grid builder, inline top-right export actions, full-width table/diagram).

- [ ] **Step 4: Final commit (if any cleanup was needed)**

```bash
git add -A
git commit -m "chore: mobile-responsive UX regression pass"
```

(Skip this commit if Step 3 found nothing to fix.)
