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
