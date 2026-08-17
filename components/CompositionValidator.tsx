'use client'

import { useMemo } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { validateComposition } from '@/lib/validator'

export function CompositionValidator() {
  const stems = useBouquetStore((state) => state.stems)
  const warnings = useMemo(() => validateComposition(stems), [stems])

  return (
    <section className="space-y-2">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">Validación</h2>
      {warnings.length === 0 ? (
        <p className="text-[12.5px] text-muted italic">Sin avisos.</p>
      ) : (
        <ul className="space-y-1">
          {warnings.map((warning) => (
            <li key={warning.message} className="text-[12.5px] text-warn border-l-2 border-warn pl-2">
              {warning.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
