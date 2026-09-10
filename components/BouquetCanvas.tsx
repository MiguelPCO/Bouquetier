// components/BouquetCanvas.tsx
'use client'

import { useBouquetStore } from '@/store/bouquet'
import { BouquetSvg, BOUQUET_VIEWBOX } from './BouquetSvg'

// Same coordinate frame as BouquetSvg, so the empty state and the drawn bouquet occupy
// exactly the same box and the layout doesn't jump when the first stem is added.
const VIEWBOX = `${BOUQUET_VIEWBOX.x} ${BOUQUET_VIEWBOX.y} ${BOUQUET_VIEWBOX.width} ${BOUQUET_VIEWBOX.height}`

export function BouquetCanvas() {
  const stems = useBouquetStore((state) => state.stems)

  return (
    <div className="w-full h-auto">
      {stems.length === 0 ? (
        <svg viewBox={VIEWBOX} className="w-full h-auto" role="img" aria-label="Vista previa del ramo">
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
