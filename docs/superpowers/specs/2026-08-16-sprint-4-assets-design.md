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
needed since input is already transparent-cut). It's an authoring-time
tool only (runs via a manually-invoked script, never imported by the app
itself), so it belongs in `devDependencies`, not `dependencies` — it
should never ship to the deployed app. (Earlier draft of this spec
claimed Next.js already vendors `sharp` for image optimization; checked
against this repo's actual `package.json` and this project's build has
passed all session without it — that claim was wrong and is corrected
here rather than repeated.)

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
   padding with transparency if the trimmed content isn't square —
   **bottom-anchored**, not centered:
   `sharp().resize(480, 480, { fit: 'contain', position: 'bottom', background: { r:0,g:0,b:0,alpha:0 } })`.
4. Write to `public/photos/<species-id>.png`.
5. Print the output path and final dimensions to stdout for a quick
   sanity check.

**Why bottom-anchored, not centered**: each source photo's trimmed
bounding box has a different aspect ratio (a tall species like amarilis
trims closer to square than a wide one like dalia), so `fit: 'contain'`
must add padding somewhere to reach 480×480. Centering that padding
means the flower's visual base sits at a different height inside the
frame for every species — which breaks the single shared anchor constant
`FlowerHead.tsx` needs (see below): there would be no one `y` offset that
correctly places every photo's base at the stem-attachment point,
because each photo pads differently. Anchoring all padding to the top
(content flush to the bottom edge) makes every processed photo's base
land at the same relative position in its 480×480 frame regardless of
its original aspect ratio, which is what makes one shared offset valid.
This needs verifying once `sharp` is actually installed (Task 1's
synthetic test fixture should be asymmetric enough — a non-square source
— to prove `position: 'bottom'` is doing what's expected, not just that
the resize runs).

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
compute the "correct" offset from first principles here. It's only
usable as *one shared* constant across all 5 species because the
pipeline's bottom-anchored padding (above) makes every processed photo's
base land at the same relative frame position — without that, each
photo would need its own offset, which this plan doesn't have a field
for and isn't building. `0,0` is the stem-attachment point
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

Two changes, not one:

1. Pass `photo={stem.species.photo}` into the existing `<FlowerHead>`
   call alongside `shape`/`size`/`color`/`uid`.
2. **Photo stems must not get the depth-tone opacity applied.** The
   canvas currently wraps every stem in
   `<g style={{ opacity: stem.tone }}>` where `tone = 0.72 + (sin + 1) *
   0.14` (roughly 0.72–1.0) — this is a legitimate depth cue on flat
   vector petals with gradient fills, but on a photograph it reads as
   washed-out, and semi-transparent overlapping photos is close to a
   textbook description of the "collage" look this trial exists to rule
   out. This is the single highest-stakes correctness issue in this
   plan: per SPRINTS.md, a failed trial means "se vuelve a SVG ilustrado
   y se cierra el tema" — a one-way decision. If the trial fails because
   an opacity trick built for vector art was left applied to
   photographs, that would retire photography for the wrong reason, and
   the topic doesn't reopen. Fix: skip the tone opacity for stems with
   `photo` set —
   `style={{ opacity: stem.species.photo ? 1 : stem.tone }}` — so photo
   stems always render fully opaque. Record this choice in
   `docs/photo-pipeline.md` so whoever judges the trial's 15-stem
   bouquet knows what they're looking at.

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
  against a synthetic placeholder during implementation, before real
  photos exist); `npx tsc --noEmit` passes; manual browser check that a
  photo-mode stem renders without crashing (using the same placeholder).
  **This verification is weaker than it looks**: a synthetic hard-edged
  opaque shape is the one input `sharp().trim()` is guaranteed to handle
  well. Real user-cut PNGs have feathered/antialiased alpha edges, where
  `trim()`'s default threshold can halo or over-crop — that failure mode
  is genuinely untestable until photo #1 arrives, and the plan should
  say so rather than imply the synthetic test proves real-photo
  readiness.
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
