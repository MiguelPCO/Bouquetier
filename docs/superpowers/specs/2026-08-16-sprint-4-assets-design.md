# Sprint 4 · Assets (5-species trial) — Design

Date: 2026-08-16
Status: approved (chat), pending spec review

## Objective

Per SPRINTS.md, Sprint 4 replaces the parametric SVG flower heads with
photography, but is explicitly gated: "se abre solo tras la prueba de 5
especies." This spec covers **only that trial** — the normalization
pipeline, the data-model and rendering changes needed to composite a
photo instead of an SVG shape, and the mechanics of producing and judging
5 trial species. Producing the remaining 30 species is out of scope here;
it only happens after the trial passes, as its own follow-up plan.

**Completion bar for this plan** (from SPRINTS.md, scoped to the trial):
pipeline documented, 5 species produced, a 15-stem bouquet built from
them evaluated by the user as photographic (not collage). The
pass/fail judgment itself belongs to the user — this plan builds the
capability to render that bouquet and stops at "show it to the user,"
it does not encode an automated pass/fail check.

## Blocking dependency

This plan cannot complete the "5 species produced and evaluated" step
without the user supplying 5 pre-cut, transparent-background PNGs (one
per species). The pipeline, data model, and rendering integration can be
built and reviewed without them (using one placeholder asset for
integration testing), but the actual trial and its visual judgment wait
on that delivery. The plan should make this dependency explicit rather
than block on it silently.

## Decisions already made (chat, this session)

- **Sourcing**: user supplies the photos. Not AI-generated, not stock —
  avoids licensing risk and quality-consistency risk of images from
  outside the project's control.
- **Background removal**: user delivers already-transparent PNGs. No
  automated segmentation (no `rembg`/ML model, no `remove.bg` API) — this
  keeps the pipeline dependency-light and avoids variable-quality
  auto-cutouts.
- **Trial species** (5, spanning distinct existing `Shape` values so the
  photo-vs-SVG comparison is meaningful across the app's shape variety):
  `peonia` (peony), `tulipan` (tulip), `dalia` (dahlia), `eucalipto`
  (leaf/green), `amarilis` (umbel).

## Photo delivery convention

User delivers one PNG per trial species, named by species id
(`peonia.png`, `tulipan.png`, `dalia.png`, `eucalipto.png`,
`amarilis.png`), dropped in a `assets/photos-raw/` intake folder (new,
git-ignored — raw deliveries aren't committed, only the pipeline's
normalized output is). Convention for the photo itself: transparent
background, flower head roughly centered, filling ~90% of the frame
(some transparent margin is fine — the pipeline trims it), no specific
aspect ratio required (pipeline normalizes to square).

## Architecture

```
assets/photos-raw/            new, git-ignored — raw user-delivered PNGs land here
scripts/prepare-photo.mjs     new — normalization pipeline (Node script, run manually per photo)
public/photos/                new — pipeline output, committed (small, final assets)
lib/species.ts                modify — add optional Species.photo field
components/FlowerHead.tsx     modify — add optional photo prop, image rendering path
components/BouquetCanvas.tsx  modify — pass species.photo through to FlowerHead
docs/photo-pipeline.md        new — documents the normalization pipeline (the spec's "documented" requirement)
```

New dependency: `sharp` (image resizing/cropping, no ML/segmentation
needed since input is already transparent-cut). Common, lightweight,
no native-binding surprises on this stack (Next.js already vendors
`sharp` transitively for `next/image` optimization in production, so
this isn't introducing an unfamiliar toolchain — see Testing section).

## Module: `scripts/prepare-photo.mjs`

Run manually per photo (not part of the build — this is an authoring-time
tool, like the Sprint 2 oklch-conversion scratch script, except this one
is real and reused, so it's committed): `node scripts/prepare-photo.mjs
<species-id>`.

Steps:
1. Read `assets/photos-raw/<species-id>.png`.
2. Trim fully-transparent padding to a tight bounding box around the
   visible content (`sharp().trim()`).
3. Resize to a standard square canvas (480×480), preserving aspect ratio,
   padding with transparency if the trimmed content isn't square
   (`sharp().resize(480, 480, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })`).
4. Write to `public/photos/<species-id>.png`.
5. Print the output path and final dimensions to stdout for a quick
   sanity check.

No color/exposure correction in this pass — the 5 photos are all
user-sourced under the user's own control, so cross-photo consistency is
the user's responsibility at capture time, not something this script
attempts to algorithmically fix. If the trial reveals visible
inconsistency, that becomes a documented finding for the follow-up
35-species plan, not silently patched here.

## Module: `lib/species.ts`

Add one optional field:

```ts
export interface Species {
  // ...existing fields unchanged...
  photo?: string  // filename under public/photos/, e.g. 'peonia.png'
}
```

Only the 5 trial species get this field set, pointing at their
`public/photos/<id>.png` output. All other species are unchanged
(`photo` absent = existing parametric SVG rendering, untouched).

## Module: `components/FlowerHead.tsx`

Add an optional `photo?: string` prop. When present, render an `<image>`
element instead of the shape switch — the parametric rendering path is
completely bypassed for photo species, not blended with it:

```tsx
interface FlowerHeadProps {
  shape: Shape
  size: number
  color: string
  uid: number
  photo?: string
}

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
  // ...existing switch, unchanged...
}
```

**Anchor offset (`y={-s * 0.75}`) is a starting estimate, not a derived
value** — unlike Sprint 3's assembly-diagram formulas, there's no way to
compute the "correct" offset from first principles here, because it
depends on where each real photo's visual mass sits relative to its
frame, which varies per photo. `0,0` is the stem-attachment point
(confirmed by reading `BouquetCanvas.tsx`: the stem's bezier path ends at
`(stem.x, stem.y)`, and `<FlowerHead>` renders inside a `<g
transform="translate(stem.x stem.y) scale(...)">`, so local `(0,0)` in
`FlowerHead` *is* that attachment point — matching how the existing
parametric shapes are drawn mostly-upward from near-origin, e.g.
`petal()`'s `-length` term). `-s * 0.75` roughly centers a photo whose
subject fills most of a square frame so that the frame's lower quarter
(implicitly, the stem/base area) sits near the attachment point. This
gets tuned by eye once real photos exist — the implementation plan should
treat this as an adjustable constant, verified visually during the trial
step, not asserted as correct by a unit test (there's nothing to assert:
"does this look right" is exactly the human judgment this plan defers to
the user).

## Module: `components/BouquetCanvas.tsx`

One-line change: pass `photo={stem.species.photo}` into the existing
`<FlowerHead>` call alongside `shape`/`size`/`color`/`uid`.

## `docs/photo-pipeline.md`

Documents: the delivery convention (above), how to run
`prepare-photo.mjs`, the current anchor-offset constant and that it's a
visually-tuned estimate, and — once the trial concludes — the outcome
(pass → proceed to 35-species follow-up plan; fail → revert `photo`
fields, this doc records why, topic closes per SPRINTS.md's own rule).

## Testing

- `sharp` is a native-binding package; this repo currently has zero
  native dependencies (checked `package.json` — pure JS/TS stack). Adding
  it is a real dependency-surface change, unlike Sprint 3's "no new
  deps" scope. Flagged here explicitly rather than silently introduced.
- No automated test for the photo rendering path — same reasoning as
  Sprint 3's UI components (no React Testing Library in this project),
  compounded by the fact that "does the photo look right" has no
  assertion-shaped answer. Verification is: `prepare-photo.mjs` runs
  without error and produces a 480×480 PNG (checkable by running it once
  against a placeholder transparent PNG during implementation, before
  real photos exist); `npx tsc --noEmit` passes; manual browser
  check that a photo-mode stem renders without crashing (using the same
  placeholder).
- The actual trial (5 real photos → 15-stem bouquet → user judgment) is
  explicitly NOT automatable and is the plan's final, human-gated step.

## Non-goals for this plan

- No automated background removal — user delivers pre-cut PNGs.
- No color/exposure normalization — out of scope, noted as a candidate
  follow-up if the trial's photos look inconsistent.
- No production of the remaining 30 species — conditional on the gate,
  separate future plan.
- No automated "does this look like a collage" check — human judgment,
  not code.
- No change to any of the 30 non-trial species' rendering — parametric
  SVG path is untouched and remains the default.
