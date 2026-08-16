# Sprint 4 · Assets (5-species trial) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the normalization pipeline and rendering capability needed to composite a real photo in place of a parametric SVG flower head, verified end-to-end with a synthetic placeholder image — so the app is ready the moment the user delivers the 5 real trial photos.

**Architecture:** A standalone Node script (`scripts/prepare-photo.mjs`, using `sharp`) trims and resizes a user-delivered transparent PNG into a standard-size asset under `public/photos/`. `lib/species.ts` gains an optional `photo` field; `FlowerHead.tsx` gains an optional `photo` prop that, when present, renders an `<image>` instead of the parametric shape switch, completely bypassing it. `BouquetCanvas.tsx` passes the field through. No real species gets `photo` set by this plan — that's the next step, blocked on the user's photo delivery, and out of this plan's scope.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, `sharp` (new dependency), Node ESM scripts.

**Spec:** `docs/superpowers/specs/2026-08-16-sprint-4-assets-design.md`

## Global Constraints

- This plan does **not** set any real species' `photo` field and does **not** produce or commit any real trial photo — those steps are blocked on the user delivering 5 PNGs (spec: Blocking dependency) and happen after this plan, as a follow-up once the capability built here is verified.
- No automated background removal, no color/exposure normalization (spec: Non-goals).
- `sharp` is a new, real dependency (native binding) — this is a deliberate, disclosed exception to prior sprints' "no new deps" scope, not an oversight (spec: Testing section).
- Any temporary test fixtures created to verify the pipeline/rendering (synthetic placeholder PNGs, temporary edits to `lib/species.ts` for manual browser verification) must be deleted/reverted before that task's commit — nothing fake ships in a commit.
- Language: Spanish UI copy / doc content, matching the rest of the app and its docs.

---

### Task 1: `scripts/prepare-photo.mjs` — the normalization pipeline

**Files:**
- Modify: `package.json` (add `sharp` dependency)
- Create: `scripts/prepare-photo.mjs`
- Modify: `.gitignore` (add `assets/photos-raw/`)
- Create: `docs/photo-pipeline.md` is a separate task (Task 4) — this task is code only

**Interfaces:**
- Consumes: nothing from this codebase.
- Produces: a CLI script, `node scripts/prepare-photo.mjs <species-id>`, reading `assets/photos-raw/<species-id>.png` and writing `public/photos/<species-id>.png` — consumed by whoever runs the real trial later (not by any other task in this plan).

- [ ] **Step 1: Install `sharp`**

Run: `npm install sharp`
Expected: `package.json`/`package-lock.json` gain the `sharp` entry, `node_modules/sharp` installed.

- [ ] **Step 2: Add the ignore entry for raw photo intake**

In `.gitignore`, add a new section after the existing `# vercel` block:

```
# photo pipeline intake (raw user-delivered photos, not committed)
/assets/photos-raw/
```

- [ ] **Step 3: Write `scripts/prepare-photo.mjs`**

```js
#!/usr/bin/env node
import sharp from 'sharp'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const speciesId = process.argv[2]
if (!speciesId) {
  console.error('Usage: node scripts/prepare-photo.mjs <species-id>')
  process.exit(1)
}

const inputPath = path.join(root, 'assets', 'photos-raw', `${speciesId}.png`)
const outputDir = path.join(root, 'public', 'photos')
const outputPath = path.join(outputDir, `${speciesId}.png`)

const { data, info } = await sharp(inputPath).trim().png().toBuffer({ resolveWithObject: true })

await mkdir(outputDir, { recursive: true })
await sharp(data)
  .resize(480, 480, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(outputPath)

console.log(`Wrote ${outputPath} (trimmed source was ${info.width}x${info.height}, output is 480x480)`)
```

- [ ] **Step 4: Verify the script against a synthetic test fixture (not a real photo)**

There's no real photo yet — synthesize one to prove the trim/resize logic works. Run this via `node -e` (or a throwaway `.mjs` file you delete afterward — either way, nothing here gets committed):

```js
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

await mkdir('assets/photos-raw', { recursive: true })

const square = await sharp({
  create: { width: 60, height: 60, channels: 4, background: { r: 220, g: 40, b: 90, alpha: 1 } },
}).png().toBuffer()

await sharp({
  create: { width: 300, height: 150, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: square, left: 100, top: 40 }])
  .png()
  .toFile('assets/photos-raw/_test.png')
```

This creates a 300×150 transparent canvas with a 60×60 opaque square placed off-center — asymmetric padding on all sides, a real test of `trim()`.

Then run: `node scripts/prepare-photo.mjs _test`
Expected output: `Wrote .../public/photos/_test.png (trimmed source was ~60x~60, output is 480x480)` — the trim should reduce the reported source dimensions from 300×150 down to roughly 60×60 (allow a few px of tolerance; `sharp.trim()`'s edge detection isn't pixel-perfect on a hard-edged synthetic square, but it should be close, not still 300×150).

If the trimmed dimensions come back as ~300×150 (unchanged), `trim()` isn't working as expected — stop and investigate before proceeding, don't paper over it.

- [ ] **Step 5: Delete the test fixture**

```bash
rm assets/photos-raw/_test.png public/photos/_test.png
```

These are synthetic, not real content — `assets/photos-raw/` is gitignored so its removal doesn't need a commit, but `public/photos/_test.png` is NOT gitignored (real trial output will live there and needs to be committed later), so make sure it's deleted before this task's commit — verify with `git status` that no `_test.png` shows up as untracked.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json scripts/prepare-photo.mjs .gitignore
git commit -m "feat: add photo normalization pipeline script"
```

---

### Task 2: `lib/species.ts` — optional `photo` field

**Files:**
- Modify: `lib/species.ts`

**Interfaces:**
- Consumes: existing `Species` interface.
- Produces: `Species.photo?: string` — consumed by Task 3 (`FlowerHead.tsx`/`BouquetCanvas.tsx`) and, later, by whoever sets it on the 5 trial species once real photos exist (not this plan).

- [ ] **Step 1: Add the field**

In `lib/species.ts`, find the `Species` interface:

```ts
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
```

Add `photo` as the last field:

```ts
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
  photo?: string
}
```

Do not set `photo` on any entry in the `SPECIES` array — this plan only adds the schema field, per the Global Constraints.

- [ ] **Step 2: Verify existing tests still pass**

Run: `npx vitest run lib/species.test.ts`
Expected: all existing tests still PASS (this is a purely additive optional field — no existing test asserts an exhaustive/closed shape on `Species`, so nothing should break; confirm this is actually true rather than assuming).

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/species.ts
git commit -m "feat: add optional photo field to Species"
```

---

### Task 3: `FlowerHead.tsx` + `BouquetCanvas.tsx` — photo rendering path

**Files:**
- Modify: `components/FlowerHead.tsx`
- Modify: `components/BouquetCanvas.tsx`
- Modify (temporarily, then reverted): `lib/species.ts` — for manual verification only, not committed
- Create (temporarily, then deleted): `public/photos/_test.png` — for manual verification only, not committed

**Interfaces:**
- Consumes: `Species.photo` (Task 2).
- Produces: `FlowerHead` accepts a `photo?: string` prop and renders an `<image>` when present — this is the plan's final consumer; nothing later in this plan builds on it beyond documentation (Task 4).

- [ ] **Step 1: Add the `photo` prop and image-rendering branch to `FlowerHead.tsx`**

Current top of the file:

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
```

Replace with:

```tsx
// components/FlowerHead.tsx
import { noise } from '@/lib/vogel'
import type { Shape } from '@/lib/species'

interface FlowerHeadProps {
  shape: Shape
  size: number
  color: string
  uid: number
  photo?: string
}
```

Current function signature and start of body:

```tsx
export function FlowerHead({ shape, size: s, color, uid }: FlowerHeadProps) {
  const gradId = `fh-${shape}-${uid}`

  switch (shape) {
```

Replace with:

```tsx
export function FlowerHead({ shape, size: s, color, uid, photo }: FlowerHeadProps) {
  if (photo) {
    return (
      <image
        href={`/photos/${photo}`}
        x={-s / 2}
        y={-s * 0.75}
        width={s}
        height={s}
        preserveAspectRatio="xMidYMid meet"
      />
    )
  }

  const gradId = `fh-${shape}-${uid}`

  switch (shape) {
```

The rest of the file (the shape switch and everything below it) is unchanged — the photo branch fully bypasses it via early return, it doesn't blend with the parametric rendering.

- [ ] **Step 2: Pass `photo` through in `BouquetCanvas.tsx`**

Find:

```tsx
<FlowerHead shape={stem.species.shape} size={headPx(stem.species)} color={stem.species.color} uid={stem.uid} />
```

Replace with:

```tsx
<FlowerHead shape={stem.species.shape} size={headPx(stem.species)} color={stem.species.color} uid={stem.uid} photo={stem.species.photo} />
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify the photo path actually renders, using a synthetic placeholder (not a real photo, temporary, reverted after)**

Create a placeholder asset the same way Task 1's Step 4 did — synthesize and normalize it through the real pipeline, so this also double-checks Task 1's script still works end-to-end:

```bash
mkdir -p assets/photos-raw
node -e "
import('sharp').then(async ({ default: sharp }) => {
  const square = await sharp({ create: { width: 200, height: 200, channels: 4, background: { r: 250, g: 200, b: 60, alpha: 1 } } }).png().toBuffer()
  await sharp({ create: { width: 260, height: 260, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: square, left: 30, top: 30 }])
    .png()
    .toFile('assets/photos-raw/_test.png')
})
"
node scripts/prepare-photo.mjs _test
```

Then temporarily edit `lib/species.ts`: find the `peonia` entry in the `SPECIES` array and add `photo: '_test.png'` to it (just for this manual check — do not commit this edit). Run `npm run dev`, open `/`, add a peonía stem, confirm the canvas shows the square placeholder image where the peony's petals would normally render (proving the `<image>` branch fires and the SVG `href`/positioning resolves correctly), rather than the parametric peony shape.

- [ ] **Step 5: Revert the temporary verification changes**

```bash
git checkout -- lib/species.ts
rm -f assets/photos-raw/_test.png public/photos/_test.png
```

Confirm via `git status` that `lib/species.ts` shows no diff and no `_test.png` files are untracked before committing this task.

- [ ] **Step 6: Commit**

```bash
git add components/FlowerHead.tsx components/BouquetCanvas.tsx
git commit -m "feat: add photo rendering path to FlowerHead, wire through BouquetCanvas"
```

---

### Task 4: `docs/photo-pipeline.md`

**Files:**
- Create: `docs/photo-pipeline.md`

**Interfaces:**
- Consumes: nothing (standalone doc, references Tasks 1-3's outputs by name).
- Produces: nothing consumed by other tasks — this is the plan's closing task.

- [ ] **Step 1: Write the doc**

Create `docs/photo-pipeline.md`:

```markdown
# Pipeline de fotos — Sprint 4 (prueba de 5 especies)

## Estado

Prueba de 5 especies **pendiente** — pipeline y renderizado listos, a la
espera de que se entreguen las 5 fotos reales. Ninguna especie del
catálogo tiene `photo` asignado todavía.

## Convención de entrega

Una foto por especie de prueba, PNG con fondo transparente, flor
centrada llenando ~90% del frame, sin recorte estricto necesario (el
pipeline recorta el margen transparente sobrante). Nombre de archivo =
id de la especie (`peonia.png`, `tulipan.png`, `dalia.png`,
`eucalipto.png`, `amarilis.png`), colocado en `assets/photos-raw/`
(carpeta ignorada por git — solo el resultado normalizado se versiona).

## Ejecutar el pipeline

```bash
node scripts/prepare-photo.mjs <especie-id>
```

Recorta el margen transparente (`sharp().trim()`), redimensiona a
480×480 preservando proporción con relleno transparente si hace falta, y
escribe en `public/photos/<especie-id>.png`.

Sin corrección de color/exposición — cada foto es responsabilidad del
usuario en el momento de captura. Si la prueba revela inconsistencia
visible entre las 5, queda como hallazgo documentado para el plan de
35 especies, no se corrige aquí.

## Integración en el render

`Species.photo` (opcional) apunta al nombre de archivo bajo
`public/photos/`. Cuando está presente, `FlowerHead.tsx` renderiza un
`<image>` en vez de la forma paramétrica — sustitución completa, no
mezcla ambos modos para una misma especie.

Ancla: `(0,0)` en `FlowerHead` es el punto de unión del tallo (mismo
origen que usan las formas SVG existentes). El offset actual,
`y={-s * 0.75}`, es una **estimación de partida sin ajustar contra
fotos reales** — se recalibra a ojo una vez existan las 5 fotos de
prueba, no es un valor derivado matemáticamente como los de
`lib/assembly.ts` en el Sprint 3.

## Próximo paso

1. Recibir las 5 fotos (peonía, tulipán, dalia, eucalipto, amarilis) en
   `assets/photos-raw/`.
2. Ejecutar el pipeline sobre cada una.
3. Asignar `photo` a esas 5 entradas en `lib/species.ts`.
4. Ajustar el offset de anclaje a ojo si hace falta.
5. Montar un ramo de 15 tallos mezclando las 5 especies-foto, enseñar el
   resultado — **la decisión "¿parece foto o collage?" la toma el
   usuario**, no se automatiza.
6. Si pasa: plan aparte para producir las 35. Si no: revertir `photo` en
   las 5 especies, cerrar el tema (regla de SPRINTS.md).
```

- [ ] **Step 2: Full sanity check**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: all Vitest tests pass (species.test.ts, vogel.test.ts, assembly.test.ts, shoppingList.test.ts, validator.test.ts — unaffected by this plan's changes), no type errors, build succeeds. This also confirms `sharp` as a new dependency doesn't break the Next.js build (Next.js already vendors `sharp` transitively for image optimization, so this isn't an unfamiliar toolchain addition).

- [ ] **Step 3: Commit**

```bash
git add docs/photo-pipeline.md
git commit -m "docs: add photo pipeline documentation for Sprint 4 trial"
```
