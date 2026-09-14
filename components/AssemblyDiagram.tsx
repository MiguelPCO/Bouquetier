'use client'

import { useMemo } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { layout, DEFAULT_COMPOSITION, autoDensity } from '@/lib/vogel'
import { buildAssemblyDiagram } from '@/lib/assembly'

export function AssemblyDiagram() {
  const stems = useBouquetStore((state) => state.stems)
  const density = useMemo(() => autoDensity(stems), [stems])
  const placed = useMemo(() => layout(stems, { ...DEFAULT_COMPOSITION, density }), [stems, density])
  const steps = useMemo(() => buildAssemblyDiagram(placed), [placed])
  const ordered = useMemo(() => [...steps].sort((a, b) => a.handOrder - b.handOrder), [steps])
  const MOBILE_STEP_LIMIT = 6
  const visibleMobile = ordered.slice(0, MOBILE_STEP_LIMIT)
  const remainingMobile = ordered.length - visibleMobile.length

  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">Diagrama de montaje</h2>
      <svg viewBox="-160 -160 320 320" className="w-full h-auto max-w-[220px] mx-auto md:max-w-sm md:mx-0" role="img" aria-label="Diagrama de ángulos y cortes">
        <circle cx="0" cy="0" r="4" fill="var(--color-accent)" />
        {steps.map((step) => {
          const rad = (step.angleDeg * Math.PI) / 180
          const len = 90
          const x = len * Math.cos(rad)
          const y = len * Math.sin(rad)
          const labelX = x * 1.18
          const labelY = y * 1.18
          const lineColor = step.exceedsMaxTilt ? 'var(--color-warn)' : 'var(--color-ink)'
          return (
            <g key={step.uid}>
              <line x1="0" y1="0" x2={x} y2={y} stroke={lineColor} strokeWidth="1" opacity="0.7" />
              <text x={labelX} y={labelY} textAnchor="middle" className="text-[8px] font-mono" fill={lineColor}>
                {step.handOrder}
              </text>
              <text x={labelX} y={labelY + 10} textAnchor="middle" className="fill-muted text-[7px] font-mono">
                {step.cutCm}cm
              </text>
            </g>
          )
        })}
      </svg>
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
    </section>
  )
}
