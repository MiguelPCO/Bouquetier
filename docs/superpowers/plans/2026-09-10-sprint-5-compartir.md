# Sprint 5 — Compartir — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un ramo armado en Bouquetier se puede compartir como un link; abrirlo reconstruye el ramo exacto, muestra una imagen de Open Graph representativa, y el usuario puede además descargar el ramo como PNG.

**Architecture:** El Ramo (lista de tallos) se codifica en la URL (`?s=especie:cantidad,...`, vía `nuqs`) y esa URL es la fuente de verdad al cargar si está presente. Un componente React puro (`BouquetSvg`) genera el mismo markup SVG tanto en cliente (para descarga PNG, vía `canvas`) como en servidor (para la imagen de Open Graph, vía `sharp`) — una sola fuente de verdad del dibujo, dos rasterizadores distintos por runtime.

**Tech Stack:** Next.js 15.5.23 (App Router, Turbopack), React 19, TypeScript strict, Zustand 5, `nuqs` (nuevo), `sharp` (ya en el repo, pasa a `dependencies`), Vitest.

**Spec:** `CONTEXT.md` (glosario: Ramo / Composición / Enlace compartido) y `docs/adr/0001-share-link-encoding-and-og-image.md` — ambos en la raíz del repo, ya escritos y confirmados con el usuario.

## Global Constraints

- Encoding del Ramo en URL: `especie:cantidad` por especie, orden por primera aparición (no lista tallo-por-tallo) — ver ADR-0001.
- El parámetro `s` de la URL manda si está presente; si no, se usa `localStorage` (persist actual, sin cambios). Abrir un link reemplaza el store sin aviso.
- Ningún parámetro de `Composition` (density/tilt/rotation/jitter/spread) viaja en la URL — siempre se derivan (ver `CONTEXT.md`).
- Imagen de Open Graph: fondo crema `#EDECE6` (tarjeta social, como cualquier og:image). PNG de descarga del botón "Exportar PNG": fondo transparente (sticker para pegar en chats).
- Cero dependencias nuevas para el rasterizado — cliente usa `canvas`/`Image` nativos, servidor reusa `sharp` (ya en el repo).
- Todo el texto de UI en español, siguiendo el tono ya usado en el resto de la app (`components/*.tsx`).
- Next 15: `searchParams` en páginas/`generateMetadata` es una `Promise` — hay que `await`earlo.

---

## Task 1: Remover la rama muerta de `photo` en `FlowerHead`

La prueba de fotos (Sprint 4) cerró como no viable — ver `docs/photo-pipeline.md` y `SPRINTS.md`. El campo `photo` en `Species` y la rama `if (photo && !imgFailed)` en `FlowerHead` quedaron inalcanzables (ninguna especie tiene `photo: true` desde ese cierre). Sin `useState`, `FlowerHead` se vuelve una función pura — necesario para poder generarla en servidor más adelante (Task 3) sin duplicar la lógica de dibujo.

**Files:**
- Modify: `lib/species.ts`
- Modify: `components/FlowerHead.tsx`
- Modify: `components/BouquetCanvas.tsx`

**Interfaces:**
- Produces: `FlowerHead({ shape, size, color, uid, id }: FlowerHeadProps)` — sin `photo`, sin `useState`, función pura.

- [ ] **Step 1: Quitar el campo `photo` de `Species`**

En `lib/species.ts`, borrar estas dos líneas del `interface Species`:

```ts
  /** true once public/photos/<id>.png exists (produced by scripts/prepare-photo.mjs) */
  photo?: boolean
```

- [ ] **Step 2: Quitar la rama de foto en `FlowerHead`**

En `components/FlowerHead.tsx`:

1. Borrar el import `import { useState } from 'react'`.
2. Borrar el bloque completo:

```ts
/** Shapes whose vector rendering draws base-up from the origin (stem meets the flower's
 *  bottom edge). Every other shape draws radially centered on the origin (stem meets the
 *  flower's visual center) — see docs/photo-pipeline.md's "Ancla" section. */
const BASE_ANCHORED_SHAPES = new Set<Shape>(['tulip'])
```

3. Cambiar la firma de la interfaz y la función — `id` desaparece: era usado únicamente para construir el `href="/photos/${id}.png"` de la rama de foto; ningún otro caso (`peony`/`dahlia`/.../`spike`) lo referencia. `tsconfig.json` tiene `noUnusedParameters: true`, así que dejarlo sin usar rompe `npm run build`:

```ts
interface FlowerHeadProps {
  shape: Shape
  size: number
  color: string
  uid: number
}
```

```ts
export function FlowerHead({ shape, size: s, color, uid }: FlowerHeadProps) {
  const gradId = `fh-${shape}-${uid}`
```

4. Borrar el bloque entero que empezaba en `if (photo && !imgFailed) { ... }` (las líneas que devuelven el `<image href={...} .../>`).

- [ ] **Step 3: Quitar el prop `photo` al llamar `FlowerHead` desde `BouquetCanvas`**

En `components/BouquetCanvas.tsx`, la línea:

```tsx
<FlowerHead shape={stem.species.shape} size={headPx(stem.species)} color={stem.species.color} uid={stem.uid} id={stem.species.id} photo={stem.species.photo} />
```

pasa a:

```tsx
<FlowerHead shape={stem.species.shape} size={headPx(stem.species)} color={stem.species.color} uid={stem.uid} />
```

- [ ] **Step 4: Verificar que nada más referencia `.photo`**

Run: `grep -rn "\.photo\b\|photo?:" lib components app --include="*.ts" --include="*.tsx"`
Expected: sin resultados (0 matches).

- [ ] **Step 5: Correr la suite existente y el build**

Run: `npm run test`
Expected: 40 passed (40), sin cambios respecto al estado previo.

Run: `npm run build`
Expected: build exitoso, sin errores de tipos.

- [ ] **Step 6: Commit**

```bash
git add lib/species.ts components/FlowerHead.tsx components/BouquetCanvas.tsx
git commit -m "refactor: remove dead photo-rendering branch from FlowerHead

Sprint 4 closed as not viable (see docs/photo-pipeline.md); no species
has photo:true since. FlowerHead no longer needs useState/'use client'
to render — needed for Sprint 5's server-side SVG reuse."
```

---

## Task 2: `lib/shareLink.ts` — encode/decode/copy del Ramo

Funciones puras para convertir un `Stem[]` (el Ramo) hacia y desde el formato compacto de URL, y para construir el copy dinámico de Open Graph. Sin dependencias de React ni del store — usable tanto en cliente como en servidor.

**Files:**
- Create: `lib/shareLink.ts`
- Test: `lib/shareLink.test.ts`

**Interfaces:**
- Consumes: `SPECIES` y `Stem`/`Species` de `lib/species.ts` (ya existen).
- Produces:
  - `encodeShareLink(stems: Stem[]): string`
  - `decodeShareLink(param: string | null | undefined): Stem[]`
  - `describeShareBouquet(stems: Stem[]): { title: string; description: string }`

- [ ] **Step 1: Escribir los tests (deben fallar)**

Create `lib/shareLink.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { encodeShareLink, decodeShareLink, describeShareBouquet } from './shareLink'
import { SPECIES } from './species'

const peonia = SPECIES.find((s) => s.id === 'peonia')!
const dalia = SPECIES.find((s) => s.id === 'dalia')!
const eucalipto = SPECIES.find((s) => s.id === 'eucalipto')!

describe('encodeShareLink', () => {
  it('returns an empty string for an empty bouquet', () => {
    expect(encodeShareLink([])).toBe('')
  })

  it('encodes species:count pairs in first-appearance order', () => {
    const stems = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: peonia },
    ]
    expect(encodeShareLink(stems)).toBe('peonia:2,dalia:1')
  })
})

describe('decodeShareLink', () => {
  it('returns an empty array for null, undefined, or empty input', () => {
    expect(decodeShareLink(null)).toEqual([])
    expect(decodeShareLink(undefined)).toEqual([])
    expect(decodeShareLink('')).toEqual([])
  })

  it('reconstructs stems with sequential uids starting at 1', () => {
    const stems = decodeShareLink('peonia:2,dalia:1')
    expect(stems).toEqual([
      { uid: 1, species: peonia },
      { uid: 2, species: peonia },
      { uid: 3, species: dalia },
    ])
  })

  it('round-trips through encodeShareLink', () => {
    const original = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: eucalipto },
    ]
    const roundTripped = decodeShareLink(encodeShareLink(original))
    expect(roundTripped).toEqual(original)
  })

  it('skips unknown species ids without throwing', () => {
    expect(decodeShareLink('peonia:1,no-existe:3,dalia:2')).toEqual([
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: dalia },
    ])
  })

  it('skips entries with a non-numeric or non-positive count', () => {
    expect(decodeShareLink('peonia:0,dalia:-2,eucalipto:abc,tulipan:1')).toEqual([
      { uid: 1, species: SPECIES.find((s) => s.id === 'tulipan')! },
    ])
  })

  it('ignores malformed pairs missing the colon', () => {
    expect(decodeShareLink('peonia,dalia:2')).toEqual([
      { uid: 1, species: dalia },
      { uid: 2, species: dalia },
    ])
  })
})

describe('describeShareBouquet', () => {
  it('returns generic copy for an empty bouquet', () => {
    expect(describeShareBouquet([])).toEqual({
      title: 'Bouquetier',
      description: 'Compón un ramo y obtén la lista de la compra y el diagrama de montaje.',
    })
  })

  it('lists up to 3 distinct species by name, in first-appearance order', () => {
    const stems = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: peonia },
    ]
    expect(describeShareBouquet(stems)).toEqual({
      title: 'Bouquetier',
      description: 'Peonía y Dalia — mira este ramo',
    })
  })

  it('joins exactly 3 distinct species with a comma and "y"', () => {
    const stems = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: eucalipto },
    ]
    expect(describeShareBouquet(stems).description).toBe('Peonía, Dalia y Eucalipto — mira este ramo')
  })

  it('truncates to 3 species plus a count when there are more', () => {
    const tulipan = SPECIES.find((s) => s.id === 'tulipan')!
    const amarilis = SPECIES.find((s) => s.id === 'amarilis')!
    const stems = [
      { uid: 1, species: peonia },
      { uid: 2, species: dalia },
      { uid: 3, species: eucalipto },
      { uid: 4, species: tulipan },
      { uid: 5, species: amarilis },
    ]
    expect(describeShareBouquet(stems).description).toBe('Peonía, Dalia, Eucalipto y 2 más — mira este ramo')
  })
})
```

- [ ] **Step 2: Correr los tests y confirmar que fallan**

Run: `npm run test -- shareLink`
Expected: FAIL — `Cannot find module './shareLink'` (el archivo no existe todavía).

- [ ] **Step 3: Implementar `lib/shareLink.ts`**

```ts
import { SPECIES, type Species, type Stem } from './species'

export function encodeShareLink(stems: Stem[]): string {
  const counts = new Map<string, number>()
  for (const stem of stems) {
    counts.set(stem.species.id, (counts.get(stem.species.id) ?? 0) + 1)
  }
  return [...counts.entries()].map(([id, count]) => `${id}:${count}`).join(',')
}

export function decodeShareLink(param: string | null | undefined): Stem[] {
  if (!param) return []

  const bySpecies = new Map(SPECIES.map((s) => [s.id, s]))
  const stems: Stem[] = []
  let nextUid = 1

  for (const pair of param.split(',')) {
    const [id, countRaw] = pair.split(':')
    if (!id || countRaw === undefined) continue

    const species = bySpecies.get(id)
    if (!species) continue

    const count = Number(countRaw)
    if (!Number.isFinite(count) || count <= 0) continue

    for (let i = 0; i < Math.floor(count); i++) {
      stems.push({ uid: nextUid++, species })
    }
  }

  return stems
}

function speciesNamesInOrder(stems: Stem[]): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const stem of stems) {
    if (seen.has(stem.species.id)) continue
    seen.add(stem.species.id)
    names.push(stem.species.name)
  }
  return names
}

function joinWithY(names: string[]): string {
  if (names.length === 1) return names[0]!
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function describeShareBouquet(stems: Stem[]): { title: string; description: string } {
  const title = 'Bouquetier'

  if (stems.length === 0) {
    return { title, description: 'Compón un ramo y obtén la lista de la compra y el diagrama de montaje.' }
  }

  const names = speciesNamesInOrder(stems)
  const shown = names.slice(0, 3)
  const rest = names.length - shown.length

  const list = rest > 0 ? `${shown.join(', ')} y ${rest} más` : joinWithY(shown)

  return { title, description: `${list} — mira este ramo` }
}

export type { Species }
```

- [ ] **Step 4: Correr los tests y confirmar que pasan**

Run: `npm run test -- shareLink`
Expected: 9 passed (9).

- [ ] **Step 5: Commit**

```bash
git add lib/shareLink.ts lib/shareLink.test.ts
git commit -m "feat: add shareLink encode/decode/copy for the URL share link"
```

---

## Task 3: `components/BouquetSvg.tsx` — SVG puro, reusable cliente/servidor

Se extrae el `<svg>...</svg>` que hoy dibuja `BouquetCanvas` en un componente puro que solo depende de `stems` (y opcionalmente un color de fondo). `BouquetCanvas` pasa a ser un wrapper delgado que solo lee el store. Esto es lo que permite generar el mismo dibujo en el Route Handler de Open Graph (Task 5) y en la descarga de PNG (Task 8) sin duplicar la lógica de dibujo.

**Files:**
- Create: `components/BouquetSvg.tsx`
- Modify: `components/BouquetCanvas.tsx`
- Test: `components/BouquetSvg.test.ts`

**Interfaces:**
- Consumes: `layout`, `noise`, `headPx`, `autoDensity`, `DEFAULT_COMPOSITION` de `lib/vogel.ts` (ya existen); `FlowerHead` de `Task 1`.
- Produces: `BouquetSvg({ stems, background }: { stems: Stem[]; background?: string })` — componente puro sin hooks de estado, renderizable con `renderToStaticMarkup` en Node sin DOM.

- [ ] **Step 1: Escribir el test (debe fallar)**

Create `components/BouquetSvg.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BouquetSvg } from './BouquetSvg'
import { SPECIES } from '@/lib/species'

const peonia = SPECIES.find((s) => s.id === 'peonia')!
const dalia = SPECIES.find((s) => s.id === 'dalia')!

describe('BouquetSvg', () => {
  it('renders a self-contained <svg> with the expected viewBox', () => {
    const markup = renderToStaticMarkup(
      BouquetSvg({ stems: [{ uid: 1, species: peonia }] })
    )
    expect(markup).toMatch(/^<svg /)
    expect(markup).toContain('viewBox="-200 -310 400 450"')
  })

  it('renders one <g> group per stem', () => {
    const markup = renderToStaticMarkup(
      BouquetSvg({ stems: [{ uid: 1, species: peonia }, { uid: 2, species: dalia }] })
    )
    const stemGroups = markup.match(/<g style="opacity:/g) ?? []
    expect(stemGroups).toHaveLength(2)
  })

  it('renders no background rect when background is omitted', () => {
    const markup = renderToStaticMarkup(BouquetSvg({ stems: [{ uid: 1, species: peonia }] }))
    expect(markup).not.toContain('<rect')
  })

  it('renders a background rect filling the viewBox when background is provided', () => {
    const markup = renderToStaticMarkup(
      BouquetSvg({ stems: [{ uid: 1, species: peonia }], background: '#EDECE6' })
    )
    expect(markup).toContain('<rect x="-200" y="-310" width="400" height="450" fill="#EDECE6"')
  })

  it('renders nothing extra for an empty bouquet (no placeholder text baked into the export)', () => {
    const markup = renderToStaticMarkup(BouquetSvg({ stems: [] }))
    expect(markup).not.toContain('Añade una flor focal')
  })
})
```

Nota: `BouquetSvg` se llama como función directa (`BouquetSvg({...})`), no como JSX (`<BouquetSvg .../>`), porque en este test no hace falta el runtime completo de JSX — llamarla como función devuelve el mismo árbol de elementos que `renderToStaticMarkup` puede serializar igual. Si TypeScript se queja del tipo de retorno al llamarla así, envolver en `renderToStaticMarkup(<BouquetSvg stems={...} />)` funciona idéntico (preferí la forma función para no requerir configurar `.test.tsx`); usar la que compile sin fricción en este proyecto.

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `npm run test -- BouquetSvg`
Expected: FAIL — `Cannot find module './BouquetSvg'`.

- [ ] **Step 3: Crear `components/BouquetSvg.tsx`**

```tsx
// components/BouquetSvg.tsx
import type { Stem } from '@/lib/species'
import { layout, noise, headPx, autoDensity, DEFAULT_COMPOSITION } from '@/lib/vogel'
import { FlowerHead } from './FlowerHead'

interface BouquetSvgProps {
  stems: Stem[]
  /** CSS color for a background rect filling the viewBox. Omit for a transparent export. */
  background?: string
}

export function BouquetSvg({ stems, background }: BouquetSvgProps) {
  const density = autoDensity(stems)
  const placed = layout(stems, { ...DEFAULT_COMPOSITION, density })

  return (
    <svg viewBox="-200 -310 400 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ramo">
      {background && <rect x="-200" y="-310" width="400" height="450" fill={background} />}

      {placed.map((stem) => {
        const baseX = stem.x * 0.16
        const baseY = 74 + noise(stem.uid + 41) * 26
        return (
          <g key={stem.uid} style={{ opacity: stem.tone }}>
            <path
              d={`M 0 0 Q ${stem.x * 0.34} ${stem.y * 0.55} ${stem.x} ${stem.y}`}
              fill="none"
              stroke="#3F5D3A"
              strokeWidth={1.5 * stem.scale}
              strokeLinecap="round"
              opacity="0.75"
            />
            <line x1="0" y1="0" x2={baseX} y2={baseY} stroke="#3F5D3A" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
            <g transform={`translate(${stem.x} ${stem.y}) scale(${stem.scale})`}>
              <FlowerHead shape={stem.species.shape} size={headPx(stem.species)} color={stem.species.color} uid={stem.uid} />
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

Nota: se reemplazó `stroke="var(--color-accent)"` por el hex `#3F5D3A` directo — `var(--color-accent)` depende de que Tailwind haya inyectado el CSS custom property en el documento; en un SVG standalone rasterizado por `sharp` (Task 5) o exportado a PNG vía `canvas` (Task 8) no hay ese CSS cargado, así que la variable no resolvería y el trazo saldría negro por defecto. El hex es el mismo valor que `--color-accent` en `tokens/theme.css`.

- [ ] **Step 4: Correr el test y confirmar que pasa**

Run: `npm run test -- BouquetSvg`
Expected: 5 passed (5).

- [ ] **Step 5: Simplificar `BouquetCanvas.tsx` para usar `BouquetSvg`**

Reemplazar todo el contenido de `components/BouquetCanvas.tsx` por:

```tsx
// components/BouquetCanvas.tsx
'use client'

import { useBouquetStore } from '@/store/bouquet'
import { BouquetSvg } from './BouquetSvg'

export function BouquetCanvas() {
  const stems = useBouquetStore((state) => state.stems)

  return (
    <div className="w-full h-auto">
      {stems.length === 0 ? (
        <svg viewBox="-200 -310 400 450" className="w-full h-auto" role="img" aria-label="Vista previa del ramo">
          <text x="0" y="-110" textAnchor="middle" className="fill-muted font-display italic text-[14px]">
            Añade una flor focal para empezar
          </text>
        </svg>
      ) : (
        <BouquetSvg stems={stems} />
      )}
    </div>
  )
}
```

Nota: el mensaje "Añade una flor focal para empezar" se mantiene, pero fuera de `BouquetSvg` (que ahora es puro dibujo del ramo, sin estados vacíos con copy de UI) — así el PNG/OG de un ramo vacío no arrastra ese texto (confirmado por el test del Step 1 "renderiza nada extra para un ramo vacío"). También se perdió la clase `w-full h-auto` que tenía el `<svg>` original — agregala a `BouquetSvg` si hace falta para que ocupe el ancho del contenedor en pantalla: envolvé el `<BouquetSvg>` en el `<div className="w-full h-auto">` de arriba, o agregale `className="w-full h-auto"` directo al `<svg>` dentro de `BouquetSvg` (no rompe el uso server-side, es solo un atributo HTML/SVG más).

- [ ] **Step 6: Correr toda la suite y el build**

Run: `npm run test`
Expected: 45 passed (45) — 40 previos + 5 nuevos de `BouquetSvg`.

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 7: Verificación manual**

Run: `npm run dev`, abrir `http://localhost:3000`, agregar algunos tallos. El ramo se debe ver exactamente igual que antes de este cambio (mismos colores, mismo trazo verde de tallos).

- [ ] **Step 8: Commit**

```bash
git add components/BouquetSvg.tsx components/BouquetSvg.test.ts components/BouquetCanvas.tsx
git commit -m "refactor: extract BouquetSvg as a pure, server-reusable component

BouquetCanvas becomes a thin store-subscribing wrapper. BouquetSvg has
no hooks and no client-only dependency, so it renders identically via
renderToStaticMarkup on the server (needed for the OG image route and
PNG export in upcoming tasks)."
```

---

## Task 4: `store/bouquet.ts` — acción `setStems` para reemplazo masivo

Hoy el store solo tiene `add`/`remove` (uno por vez). Cargar un ramo desde un link compartido necesita reemplazar todos los tallos de una — y seguir asignando `uid`s nuevos sin colisión para cualquier `add()` posterior.

**Files:**
- Modify: `store/bouquet.ts`
- Test: `store/bouquet.test.ts` (nuevo — no existe testeo de store todavía)

**Interfaces:**
- Produces: `useBouquetStore.getState().setStems(stems: Stem[]): void` — reemplaza `stems` y recalcula `nextUid` como `1 + max(uid de los stems)` (o `1` si viene vacío).

- [ ] **Step 1: Escribir el test (debe fallar)**

Create `store/bouquet.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useBouquetStore } from './bouquet'
import { SPECIES } from '@/lib/species'

const peonia = SPECIES.find((s) => s.id === 'peonia')!
const dalia = SPECIES.find((s) => s.id === 'dalia')!

beforeEach(() => {
  useBouquetStore.setState({ stems: [], nextUid: 1 })
})

describe('setStems', () => {
  it('replaces the stems array entirely', () => {
    useBouquetStore.getState().add(dalia)
    useBouquetStore.getState().setStems([{ uid: 1, species: peonia }])
    expect(useBouquetStore.getState().stems).toEqual([{ uid: 1, species: peonia }])
  })

  it('sets nextUid to one past the highest incoming uid', () => {
    useBouquetStore.getState().setStems([
      { uid: 1, species: peonia },
      { uid: 5, species: dalia },
    ])
    expect(useBouquetStore.getState().nextUid).toBe(6)
  })

  it('resets nextUid to 1 for an empty bouquet', () => {
    useBouquetStore.getState().setStems([{ uid: 3, species: peonia }])
    useBouquetStore.getState().setStems([])
    expect(useBouquetStore.getState().nextUid).toBe(1)
  })

  it('a subsequent add() does not collide with restored uids', () => {
    useBouquetStore.getState().setStems([{ uid: 7, species: peonia }])
    useBouquetStore.getState().add(dalia)
    const uids = useBouquetStore.getState().stems.map((s) => s.uid)
    expect(new Set(uids).size).toBe(uids.length)
    expect(uids).toContain(8)
  })
})
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `npm run test -- bouquet.test`
Expected: FAIL — `setStems is not a function`.

- [ ] **Step 3: Agregar `setStems` al store**

En `store/bouquet.ts`, agregar a la interfaz `BouquetState`:

```ts
interface BouquetState {
  stems: Stem[]
  nextUid: number
  add: (species: Species) => void
  remove: (speciesId: string) => void
  setStems: (stems: Stem[]) => void
}
```

Y en el `create<BouquetState>()(persist((set) => ({ ... }` agregar, junto a `add`/`remove`:

```ts
      setStems: (stems) =>
        set(() => ({
          stems,
          nextUid: stems.reduce((max, s) => Math.max(max, s.uid), 0) + 1,
        })),
```

- [ ] **Step 4: Correr el test y confirmar que pasa**

Run: `npm run test -- bouquet.test`
Expected: 4 passed (4).

- [ ] **Step 5: Correr toda la suite**

Run: `npm run test`
Expected: 49 passed (49).

- [ ] **Step 6: Commit**

```bash
git add store/bouquet.ts store/bouquet.test.ts
git commit -m "feat: add setStems action to bulk-replace the bouquet store"
```

---

## Task 5: `app/api/og/route.ts` — imagen de Open Graph por ramo

Route Handler que lee `?s=...`, reconstruye el Ramo, dibuja el mismo `BouquetSvg` con fondo crema, y lo rasteriza a PNG con `sharp`.

**Files:**
- Modify: `package.json` (mover `sharp` de `devDependencies` a `dependencies`)
- Create: `app/api/og/route.ts`

**Interfaces:**
- Consumes: `decodeShareLink` (Task 2), `BouquetSvg` (Task 3).
- Produces: `GET /api/og?s=<especie:cantidad,...>` → `image/png`.

- [ ] **Step 1: Mover `sharp` a `dependencies`**

En `package.json`, cortar la línea `"sharp": "^0.35.3",` de `devDependencies` y pegarla en `dependencies` (orden alfabético con el resto):

```json
  "dependencies": {
    "next": "15.5.23",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "sharp": "^0.35.3",
    "zustand": "^5.0.15"
  },
```

Run: `npm install`
Expected: sin cambios de versiones instaladas (ya estaba en `node_modules`), `package-lock.json` se actualiza para reflejar la nueva sección.

- [ ] **Step 2: Crear `app/api/og/route.ts`**

```ts
// app/api/og/route.ts
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { decodeShareLink } from '@/lib/shareLink'
import { BouquetSvg } from '@/components/BouquetSvg'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const stems = decodeShareLink(searchParams.get('s'))

  const svg = renderToStaticMarkup(BouquetSvg({ stems, background: '#EDECE6' }))
  const svgDocument = `<?xml version="1.0" encoding="UTF-8"?>${svg}`

  const png = await sharp(Buffer.from(svgDocument), { density: 220 })
    .resize(1200, 630, { fit: 'contain', background: '#EDECE6' })
    .png()
    .toBuffer()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  })
}
```

Nota: `resize(1200, 630, { fit: 'contain' })` — 1200×630 es el tamaño estándar recomendado para `og:image` (Facebook/WhatsApp/Twitter); `fit: 'contain'` preserva el ramo completo sin recortarlo, rellenando con el mismo crema donde haga falta. `density: 220` le da a `sharp` suficiente resolución de rasterizado del SVG (que tiene coordenadas relativamente chicas, -200..200) antes de reescalar — sin esto el PNG puede salir borroso.

`Cache-Control: immutable` es seguro acá porque un mismo `s` siempre produce el mismo PNG (todo determinista, ver `CONTEXT.md`/ADR-0001) — cachear agresivamente por link compartido no rompe nada.

- [ ] **Step 3: Verificación manual**

Run: `npm run dev`

En otra terminal:
```bash
curl -s "http://localhost:3000/api/og?s=peonia:3,dalia:3" -o /tmp/og-test.png
file /tmp/og-test.png
```
Expected: `PNG image data, 1200 x 630`. Abrir el archivo y confirmar que se ve el ramo con fondo crema, sin fondo transparente.

También probar sin parámetro:
```bash
curl -s "http://localhost:3000/api/og" -o /tmp/og-empty.png
file /tmp/og-empty.png
```
Expected: `PNG image data, 1200 x 630` — un frame crema vacío (sin tallos), sin error 500.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json app/api/og/route.ts
git commit -m "feat: add /api/og route rendering a per-bouquet Open Graph image"
```

---

## Task 6: Imagen de fallback de Open Graph (sin `s`)

Cuando se comparte la home sin ramo armado, `generateMetadata` (Task 7) necesita una imagen estática ya generada — no se genera por request. Se produce una sola vez con un script y se comitea el PNG resultante, siguiendo el mismo patrón que `scripts/prepare-photo.mjs` del pipeline de fotos (Sprint 4).

**Files:**
- Create: `scripts/generate-og-fallback.mjs`
- Create (generado por el script, se comitea): `public/og-fallback.png`

**Interfaces:**
- Produces: archivo estático `public/og-fallback.png`, 1200×630, fondo crema `#EDECE6` con el wordmark "Bouquetier".

- [ ] **Step 1: Crear el script generador**

```js
// scripts/generate-og-fallback.mjs
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'public', 'og-fallback.png')

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#EDECE6" />
  <text x="600" y="330" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-style="italic" fill="#1C1F1A">Bouquetier</text>
  <text x="600" y="390" text-anchor="middle" font-family="Courier New, monospace" font-size="22" letter-spacing="3" fill="#6B6F66">ARMA TU RAMO</text>
</svg>
`

async function main() {
  await mkdir(dirname(outPath), { recursive: true })
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  await writeFile(outPath, png)
  console.log(`Wrote ${outPath}`)
}

main()
```

Nota: usa fuentes de sistema genéricas (`Georgia`/`Courier New`) en vez de Fraunces/IBM Plex — `sharp`/librsvg rasteriza con las fuentes instaladas en la máquina que corre el script, no puede cargar `next/font` (que son fuentes de Google servidas por la app en runtime del navegador). Para una imagen de fallback genérica esto es aceptable (no es pixel-perfecto a la marca, pero comunica el nombre); si más adelante se quiere fidelidad exacta, hay que empaquetar los archivos `.ttf` de Fraunces/IBM Plex Mono en el repo y pasarle la ruta a `sharp`/`fontconfig` — fuera de alcance de este sprint.

- [ ] **Step 2: Correr el script**

Run: `node scripts/generate-og-fallback.mjs`
Expected: `Wrote .../public/og-fallback.png`

Run: `file public/og-fallback.png`
Expected: `PNG image data, 1200 x 630`

- [ ] **Step 3: Verificación manual**

Abrir `public/og-fallback.png` en un visor de imágenes. Confirmar: fondo crema, texto "Bouquetier" legible, sin errores de renderizado de fuente (glifos faltantes/cuadrados).

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-og-fallback.mjs public/og-fallback.png
git commit -m "feat: add static Open Graph fallback image for links without a bouquet"
```

---

## Task 7: `generateMetadata` en `app/page.tsx`

Conecta todo lo anterior: la página principal genera metadata de Open Graph dinámica según el `s` de la URL.

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `decodeShareLink`, `describeShareBouquet` (Task 2).

- [ ] **Step 1: Agregar `generateMetadata` a `app/page.tsx`**

`app/page.tsx` queda así (se agrega el import y la función `generateMetadata`, el resto del archivo — el componente `Home` — no cambia):

```tsx
// app/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { SpeciesCatalog } from '@/components/SpeciesCatalog'
import { decodeShareLink, describeShareBouquet } from '@/lib/shareLink'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}): Promise<Metadata> {
  const { s } = await searchParams
  const stems = decodeShareLink(s)
  const { title, description } = describeShareBouquet(stems)

  const images = stems.length > 0 ? [`/api/og?s=${encodeURIComponent(s ?? '')}`] : ['/og-fallback.png']

  return {
    title,
    description,
    openGraph: { title, description, images },
  }
}

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
        <SpeciesCatalog />
        <div className="bg-surface border border-line rounded-xl p-4">
          <BouquetCanvas />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Correr el build**

Run: `npm run build`
Expected: build exitoso, sin errores de tipos (confirma que la firma `Promise<{ s?: string }>` matchea lo que Next 15 espera para `searchParams`).

- [ ] **Step 3: Verificación manual**

Run: `npm run dev`

```bash
curl -s "http://localhost:3000/?s=peonia:3,dalia:3" | grep -o '<meta property="og:[^>]*>'
```
Expected: ver `og:title` = "Bouquetier", `og:description` conteniendo "Peonía y Dalia — mira este ramo", `og:image` apuntando a `/api/og?s=peonia%3A3%2Cdalia%3A3` (o similar codificado).

```bash
curl -s "http://localhost:3000/" | grep -o '<meta property="og:image"[^>]*>'
```
Expected: apunta a `/og-fallback.png`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: generate per-bouquet Open Graph metadata on the home page"
```

---

## Task 8: Sincronización URL ⇄ store con `nuqs`

Instala `nuqs`, envuelve la app en su adapter, y agrega el hook que: (a) al montar, si hay `s` en la URL, reemplaza el store con ese ramo; (b) en cada cambio de `stems`, escribe el `s` codificado de vuelta en la URL (shallow, sin recargar ni ensuciar el historial).

**Files:**
- Modify: `package.json` (agregar `nuqs`)
- Modify: `app/layout.tsx`
- Create: `components/ShareLinkSync.tsx`
- Modify: `app/page.tsx` (montar `ShareLinkSync`)

**Interfaces:**
- Consumes: `encodeShareLink`, `decodeShareLink` (Task 2), `useBouquetStore` (`setStems` de Task 4).

- [ ] **Step 1: Instalar `nuqs`**

Run: `npm install nuqs`
Expected: agrega `"nuqs": "^2.x.x"` a `dependencies` en `package.json`.

- [ ] **Step 2: Envolver la app en `NuqsAdapter`**

En `app/layout.tsx`, agregar el import y envolver `{children}`:

```tsx
import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { fraunces, plexSans, plexMono } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bouquetier",
  description: "Compón un ramo y obtén la lista de la compra y el diagrama de montaje.",
};

export const viewport: Viewport = {
  themeColor: "#EDECE6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Crear `components/ShareLinkSync.tsx`**

```tsx
// components/ShareLinkSync.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useQueryState } from 'nuqs'
import { useBouquetStore } from '@/store/bouquet'
import { encodeShareLink, decodeShareLink } from '@/lib/shareLink'

/** Mounts once on the composer page. Reads `s` from the URL on first load and replaces the
 *  store with it (URL wins over localStorage — see CONTEXT.md's "Enlace compartido"). After
 *  that, every store change re-encodes `s` back into the URL (shallow, replace-in-place). */
export function ShareLinkSync() {
  const [s, setS] = useQueryState('s', { history: 'replace', shallow: true })
  const stems = useBouquetStore((state) => state.stems)
  const setStems = useBouquetStore((state) => state.setStems)

  const hasLoadedFromUrl = useRef(false)

  useEffect(() => {
    if (hasLoadedFromUrl.current) return
    hasLoadedFromUrl.current = true
    if (s) {
      setStems(decodeShareLink(s))
    }
    // Only runs once, on mount — deliberately not depending on `s` again after that,
    // so it never re-triggers from the writes the effect below makes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasLoadedFromUrl.current) return
    const encoded = encodeShareLink(stems)
    setS(encoded.length > 0 ? encoded : null)
  }, [stems, setS])

  return null
}
```

Nota: el primer `useEffect` corre una sola vez al montar (`[]` de dependencias) para leer la URL inicial; el `eslint-disable` es necesario porque `react-hooks/exhaustive-deps` (parte de `next/core-web-vitals`) va a pedir agregar `s`/`setStems` — hacerlo causaría releer la URL en cada cambio, rompiendo la dirección única del sync (URL se lee una vez, después solo se escribe). El segundo efecto es el que escribe; se guarda con `hasLoadedFromUrl.current` para no pisar la URL ANTES de haber terminado de leer el `s` inicial (evita una carrera donde se escribe `s=` vacío antes de que el primer efecto llegue a `setStems`).

- [ ] **Step 4: Montar `ShareLinkSync` en la página principal**

En `app/page.tsx`, agregar el import y el componente dentro de `Home` (no renderiza nada visible):

```tsx
import { ShareLinkSync } from '@/components/ShareLinkSync'
```

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10">
      <ShareLinkSync />
      <div className="flex items-center justify-between mb-6">
        ...
```

- [ ] **Step 5: Correr toda la suite y el build**

Run: `npm run test`
Expected: 49 passed (49) — sin cambios (este componente no tiene test unitario propio, ver nota de verificación manual abajo).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 6: Verificación manual (no hay arnés de test de componentes en este proyecto — ver `lib/*.test.ts` vs. ausencia de `components/*.test.tsx` salvo `BouquetSvg.test.ts`, que testea la función pura, no el ciclo de efectos)**

Run: `npm run dev`

1. Abrir `http://localhost:3000/?s=peonia:3,dalia:3` — el catálogo debe mostrar Peonía=3, Dalia=3, y el ramo debe verse armado inmediatamente (sin tener que tocar nada).
2. Agregar un tallo de Eucalipto (+1). Confirmar que la barra de direcciones cambia a algo como `?s=peonia%3A3%2Cdalia%3A3%2Ceucalipto%3A1` sin recargar la página (sin parpadeo).
3. Recargar la página (F5) con esa URL. El ramo debe reconstruirse idéntico (Peonía 3, Dalia 3, Eucalipto 1).
4. Ir a `http://localhost:3000/` (sin `?s=`). Debe cargar lo que había en `localStorage` de antes de este test (o vacío si nunca se guardó nada) — no el ramo del link anterior.
5. Con el ramo en 0 tallos, confirmar que la URL no queda con `?s=` colgando (se limpia el parámetro, no aparece `?s=` vacío en la barra).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app/layout.tsx components/ShareLinkSync.tsx app/page.tsx
git commit -m "feat: sync bouquet state with the URL via nuqs

URL's s param wins over localStorage on load; every store change
re-encodes it back, shallow, so copying the address bar always shares
the current bouquet."
```

---

## Task 9: Exportar PNG del ramo

Botón que descarga el ramo actual como PNG con fondo transparente, usando el mismo `BouquetSvg` rasterizado client-side (sin depender de que el SVG esté visible en pantalla — funciona igual en `/` y en `/export`).

**Files:**
- Create: `lib/exportPng.ts`
- Create: `components/ExportPngButton.tsx`
- Modify: `app/page.tsx` (agregar el botón junto al canvas)
- Modify: `components/ExportView.tsx` (agregar el botón junto a "Imprimir")

**Interfaces:**
- Consumes: `BouquetSvg` (Task 3), `Stem` de `lib/species.ts`.
- Produces: `downloadBouquetPng(stems: Stem[]): Promise<void>` (dispara la descarga; no hay valor de retorno útil más allá de la promesa resuelta/rechazada).

- [ ] **Step 1: Crear `lib/exportPng.ts`**

Esta función usa `document`/`Image`/`canvas` — solo corre en el navegador, no es unit-testeable con Vitest en el entorno `node` que usa este proyecto (no hay `jsdom` configurado, y agregarlo solo para esto es más infraestructura de la que este sprint necesita). Se verifica a mano (Step 3).

```ts
// lib/exportPng.ts
'use client'

import { renderToStaticMarkup } from 'react-dom/server'
import { BouquetSvg } from '@/components/BouquetSvg'
import type { Stem } from './species'

const EXPORT_WIDTH = 900
const EXPORT_HEIGHT = 1012 // mantiene la proporción 400:450 del viewBox de BouquetSvg

export async function downloadBouquetPng(stems: Stem[]): Promise<void> {
  const svgMarkup = renderToStaticMarkup(BouquetSvg({ stems }))
  const svgWithSize = svgMarkup.replace('<svg ', `<svg width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" `)

  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWithSize)}`

  const image = new Image()
  image.src = svgDataUrl
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('No se pudo generar la imagen del ramo.'))
  })

  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_WIDTH
  canvas.height = EXPORT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo generar la imagen del ramo.')
  ctx.drawImage(image, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No se pudo generar la imagen del ramo.')

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'bouquetier-ramo.png'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Crear `components/ExportPngButton.tsx`**

```tsx
// components/ExportPngButton.tsx
'use client'

import { useState } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { downloadBouquetPng } from '@/lib/exportPng'

export function ExportPngButton() {
  const stems = useBouquetStore((state) => state.stems)
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')

  const handleClick = async () => {
    setStatus('working')
    try {
      await downloadBouquetPng(stems)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={stems.length === 0 || status === 'working'}
      className="px-3 py-1.5 rounded-md border border-line text-[13px] disabled:opacity-40"
    >
      {status === 'working' ? 'Generando…' : status === 'error' ? 'Error, reintentar' : 'Exportar PNG'}
    </button>
  )
}
```

- [ ] **Step 3: Verificación manual**

Run: `npm run dev`, abrir `http://localhost:3000`, armar un ramo, clickear "Exportar PNG". Confirmar: se descarga `bouquetier-ramo.png`, al abrirlo se ve el ramo con **fondo transparente** (no crema) — comprobable abriéndolo en un visor que muestre transparencia como ajedrezado, o pegándolo sobre un fondo oscuro.

Repetir en `http://localhost:3000/export` (después de agregar el botón ahí en el Step 5) con el mismo ramo — el PNG debe ser idéntico al generado desde `/`.

- [ ] **Step 4: Agregar el botón en `app/page.tsx`**

Junto al link "Exportar →", agregar el botón (import + uso):

```tsx
import { ExportPngButton } from '@/components/ExportPngButton'
```

```tsx
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Monta tu ramo</h1>
        <div className="flex items-center gap-3">
          <ExportPngButton />
          <Link href="/export" className="text-accent underline text-[13px]">
            Exportar →
          </Link>
        </div>
      </div>
```

- [ ] **Step 5: Agregar el botón en `components/ExportView.tsx`**

Junto al botón "Imprimir":

```tsx
import { ExportPngButton } from './ExportPngButton'
```

```tsx
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-md border border-line text-[13px]"
        >
          Imprimir
        </button>
```

pasa a:

```tsx
        <div className="flex items-center gap-2">
          <ExportPngButton />
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-md border border-line text-[13px]"
          >
            Imprimir
          </button>
        </div>
```

- [ ] **Step 6: Correr toda la suite y el build**

Run: `npm run test`
Expected: 49 passed (49) — sin nuevos tests automatizados en este task (ver nota del Step 1).

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 7: Commit**

```bash
git add lib/exportPng.ts components/ExportPngButton.tsx app/page.tsx components/ExportView.tsx
git commit -m "feat: add PNG export button to the composer and export views"
```

---

## Task 10: Botón "Copiar enlace"

`navigator.share()` en mobile (share-sheet nativo), fallback a portapapeles en desktop.

**Files:**
- Create: `components/CopyShareLinkButton.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `describeShareBouquet` (Task 2), `useBouquetStore`.

- [ ] **Step 1: Crear `components/CopyShareLinkButton.tsx`**

```tsx
// components/CopyShareLinkButton.tsx
'use client'

import { useState } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { describeShareBouquet } from '@/lib/shareLink'

export function CopyShareLinkButton() {
  const stems = useBouquetStore((state) => state.stems)
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    const url = window.location.href
    const { title, description } = describeShareBouquet(stems)

    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url })
      } catch {
        // El usuario cerró el share-sheet — no es un error a mostrar.
      }
      return
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={stems.length === 0}
      className="px-3 py-1.5 rounded-md border border-line text-[13px] disabled:opacity-40"
    >
      {copied ? '¡Copiado!' : 'Copiar enlace'}
    </button>
  )
}
```

- [ ] **Step 2: Agregar el botón en `app/page.tsx`**

Agregar el import:

```tsx
import { CopyShareLinkButton } from '@/components/CopyShareLinkButton'
```

Reemplazar el `<div className="flex items-center gap-3">...</div>` que dejó el Task 9 (el que envuelve `<ExportPngButton />` y el link "Exportar →") por:

```tsx
        <div className="flex items-center gap-3">
          <CopyShareLinkButton />
          <ExportPngButton />
          <Link href="/export" className="text-accent underline text-[13px]">
            Exportar →
          </Link>
        </div>
```

- [ ] **Step 3: Correr el build**

Run: `npm run build`
Expected: build exitoso.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, abrir `http://localhost:3000` en desktop Chrome, armar un ramo, clickear "Copiar enlace". Confirmar: el botón muestra "¡Copiado!" por 2 segundos (desktop no tiene `navigator.share`, cae al portapapeles), y pegar en cualquier lado confirma que la URL tiene el `?s=...` del ramo actual.

En un teléfono (o Chrome DevTools con device emulation + un navegador que exponga `navigator.share`, ej. Chrome Android real), confirmar que se abre el share-sheet nativo en vez de copiar directo.

- [ ] **Step 5: Commit**

```bash
git add components/CopyShareLinkButton.tsx app/page.tsx
git commit -m "feat: add share-link button with Web Share API + clipboard fallback"
```

---

## Post-plan check

Después del Task 10, correr una vez más de punta a punta:

```bash
npm run lint
npm run test
npm run build
```

Expected: los tres sin errores. Sprint 5 completo: `SPRINTS.md` y `CLAUDE.md` quedan para actualizar manualmente marcando Sprint 5 como cerrado (no está incluido como task de código en este plan — es edición de docs, seguí el mismo patrón usado al cerrar Sprint 4).
