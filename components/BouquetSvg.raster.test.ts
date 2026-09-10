import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { BouquetSvg, BOUQUET_VIEWBOX } from './BouquetSvg'
import { SPECIES } from '@/lib/species'

/**
 * Rasterization regression guard for the OG image route.
 *
 * A markup-only test cannot catch this class of bug: the SVG string looked perfectly fine
 * while `sharp`/librsvg painted every flower head solid black, because librsvg does not
 * implement CSS Color Level 4 `oklch()` (empirically confirmed against sharp@0.35.3 — an
 * `oklch()` fill rasterizes to [0,0,0,255]). So this test actually runs the rasterizer and
 * looks at pixels, exactly like `app/api/og/route.ts` does.
 */

const peonia = SPECIES.find((s) => s.id === 'peonia')!
const girasol = SPECIES.find((s) => s.id === 'girasol')!

const RASTER_WIDTH = 400
const RASTER_HEIGHT = 450

/** Rasterizes BouquetSvg the same way app/api/og/route.ts does, at 1 unit = 1 px. */
async function rasterize(stems: { uid: number; species: (typeof SPECIES)[number] }[]) {
  const svg = renderToStaticMarkup(BouquetSvg({ stems, background: '#EDECE6' }))
  const sized = svg.replace('<svg ', `<svg width="${RASTER_WIDTH}" height="${RASTER_HEIGHT}" `)
  const { data, info } = await sharp(Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>${sized}`))
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, info }
}

/** Pixel at SVG user-space coordinates, mapped through the viewBox into the raster. */
function pixelAt(
  data: Buffer,
  info: { width: number; height: number; channels: number },
  userX: number,
  userY: number
): [number, number, number] {
  const px = Math.round(((userX - BOUQUET_VIEWBOX.x) / BOUQUET_VIEWBOX.width) * info.width)
  const py = Math.round(((userY - BOUQUET_VIEWBOX.y) / BOUQUET_VIEWBOX.height) * info.height)
  const idx = (py * info.width + px) * info.channels
  return [data[idx]!, data[idx + 1]!, data[idx + 2]!]
}

const isNearBlack = ([r, g, b]: [number, number, number]) => r < 40 && g < 40 && b < 40

describe('BouquetSvg rasterized through sharp', () => {
  it('rasterizes flower heads in real color, not black', async () => {
    // One stem only: `layout()` places stem n=1 at r = density * sqrt(1) * silhouette, and
    // with a single peonía the head is large enough that the cluster around its own origin
    // is solidly petal. Sample a small neighbourhood around that head's center.
    const stems = [{ uid: 1, species: peonia }]
    const { data, info } = await rasterize(stems)

    const { layout, autoDensity, DEFAULT_COMPOSITION } = await import('@/lib/vogel')
    const placed = layout(stems, { ...DEFAULT_COMPOSITION, density: autoDensity(stems) })
    const head = placed[0]!

    const samples: [number, number, number][] = []
    for (const dx of [-8, 0, 8]) {
      for (const dy of [-8, 0, 8]) {
        samples.push(pixelAt(data, info, head.x + dx, head.y + dy))
      }
    }

    // Every sample lands on the flower head; none of them may be the black that
    // an unconverted `oklch()` fill produced.
    for (const sample of samples) {
      expect(isNearBlack(sample), `sampled pixel ${sample.join(',')} is near-black`).toBe(false)
    }

    // And at least one sample must actually differ from the cream background — proving we
    // sampled the flower, not just empty canvas.
    const isCream = ([r, g, b]: [number, number, number]) => r > 225 && g > 225 && b > 220
    expect(samples.some((s) => !isCream(s))).toBe(true)
  })

  it('preserves distinct species colors through the rasterizer', async () => {
    // Peonía is pink, girasol is yellow. If oklch were being dropped to black, both would
    // rasterize identically — this asserts they don't.
    const { layout, autoDensity, DEFAULT_COMPOSITION } = await import('@/lib/vogel')

    const sampleHead = async (species: (typeof SPECIES)[number]) => {
      const stems = [{ uid: 1, species }]
      const { data, info } = await rasterize(stems)
      const placed = layout(stems, { ...DEFAULT_COMPOSITION, density: autoDensity(stems) })
      const head = placed[0]!
      // Offset off the head's exact center: several shapes draw a small dark/neutral eye
      // right at the origin, which would be dark regardless of the species color.
      return pixelAt(data, info, head.x + 10, head.y)
    }

    const pink = await sampleHead(peonia)
    const yellow = await sampleHead(girasol)

    expect(isNearBlack(pink)).toBe(false)
    expect(isNearBlack(yellow)).toBe(false)
    expect(pink).not.toEqual(yellow)
  })
})
