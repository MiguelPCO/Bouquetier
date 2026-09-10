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
