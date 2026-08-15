// components/BouquetCanvas.tsx
'use client'

import { useMemo } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { layout, noise, headPx, autoDensity } from '@/lib/vogel'
import { FlowerHead } from './FlowerHead'

const TILT_DEG = 62
const ROTATION_DEG = 0
const JITTER = 0.5
const SPREAD = 0.55

export function BouquetCanvas() {
  const stems = useBouquetStore((state) => state.stems)

  const density = useMemo(() => autoDensity(stems), [stems])

  const placed = useMemo(
    () => layout(stems, { density, tiltDeg: TILT_DEG, rotation: (ROTATION_DEG * Math.PI) / 180, jitter: JITTER, spread: SPREAD }),
    [stems, density]
  )

  return (
    <svg viewBox="-200 -310 400 450" className="w-full h-auto" role="img" aria-label="Vista previa del ramo">
      {placed.length === 0 && (
        <text x="0" y="-110" textAnchor="middle" className="fill-muted font-display italic text-[14px]">
          Añade una flor focal para empezar
        </text>
      )}

      {placed.map((stem) => {
        const baseX = stem.x * 0.16
        const baseY = 74 + noise(stem.uid + 41) * 26
        return (
          <g key={stem.uid} style={{ opacity: stem.tone }}>
            <path
              d={`M 0 0 Q ${stem.x * 0.34} ${stem.y * 0.55} ${stem.x} ${stem.y}`}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={1.5 * stem.scale}
              strokeLinecap="round"
              opacity="0.75"
            />
            <line x1="0" y1="0" x2={baseX} y2={baseY} stroke="var(--color-accent)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
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
