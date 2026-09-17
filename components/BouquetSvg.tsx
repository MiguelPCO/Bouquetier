// components/BouquetSvg.tsx
import type { Stem } from '@/lib/species'
import { layout, noise, headPx, autoDensity, DEFAULT_COMPOSITION, BOUQUET_VIEWBOX } from '@/lib/vogel'
import { FlowerHead } from './FlowerHead'

const VIEWBOX = `${BOUQUET_VIEWBOX.x} ${BOUQUET_VIEWBOX.y} ${BOUQUET_VIEWBOX.width} ${BOUQUET_VIEWBOX.height}`

// Stem green (#3F5D3A) and the base-ribbon browns are hardcoded hex on purpose: this SVG is
// also rasterized standalone (sharp in app/api/og/route.ts, canvas in lib/exportPng.ts),
// where no stylesheet is loaded and a `var(--color-*)` would resolve to nothing and paint
// black. #3F5D3A must be kept in sync by hand with `--color-accent` in tokens/theme.css —
// a theme change there will NOT propagate here.
const STEM_GREEN = '#3F5D3A'

interface BouquetSvgProps {
  stems: Stem[]
  /** CSS color for a background rect filling the viewBox. Omit for a transparent export. */
  background?: string
  /** Forwarded to FlowerHead to keep this SVG's gradient ids from colliding with another
   *  BouquetSvg mounted elsewhere in the same document — see FlowerHeadProps.instanceId. */
  instanceId?: string
  /**
   * When provided, BouquetCanvas (the interactive, client-only view) uses this to grab a ref
   * to each stem's flower-head <g> and drives its position/scale with GSAP instead of the
   * static `transform` attribute below. Omitted by every other caller (the OG route, PNG
   * export) — BouquetSvg itself stays hook-free either way, this is just a ref pass-through.
   */
  getGroupRef?: (uid: number) => (el: SVGGElement | null) => void
}

export function BouquetSvg({ stems, background, instanceId, getGroupRef }: BouquetSvgProps) {
  const density = autoDensity(stems)
  const placed = layout(stems, { ...DEFAULT_COMPOSITION, density })

  return (
    <svg viewBox={VIEWBOX} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ramo">
      {background && (
        <rect
          x={BOUQUET_VIEWBOX.x}
          y={BOUQUET_VIEWBOX.y}
          width={BOUQUET_VIEWBOX.width}
          height={BOUQUET_VIEWBOX.height}
          fill={background}
        />
      )}

      {placed.map((stem) => {
        const baseX = stem.x * 0.16
        const baseY = 74 + noise(stem.uid + 41) * 26
        return (
          <g key={stem.uid} style={{ opacity: stem.tone }}>
            <path
              d={`M 0 0 Q ${stem.x * 0.34} ${stem.y * 0.55} ${stem.x} ${stem.y}`}
              fill="none"
              stroke={STEM_GREEN}
              strokeWidth={1.5 * stem.scale}
              strokeLinecap="round"
              opacity="0.75"
            />
            <line x1="0" y1="0" x2={baseX} y2={baseY} stroke={STEM_GREEN} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
            <g
              ref={getGroupRef?.(stem.uid)}
              transform={getGroupRef ? undefined : `translate(${stem.x} ${stem.y}) scale(${stem.scale})`}
            >
              <FlowerHead
                shape={stem.species.shape}
                size={headPx(stem.species)}
                color={stem.species.color}
                uid={stem.uid}
                instanceId={instanceId}
              />
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
