'use client'

import Link from 'next/link'
import { useBouquetStore } from '@/store/bouquet'
import { ShoppingList } from './ShoppingList'
import { CompositionValidator } from './CompositionValidator'
import { AssemblyDiagram } from './AssemblyDiagram'
import { ExportPngButton } from './ExportPngButton'
import { CopyShareLinkButton } from './CopyShareLinkButton'

export function ExportView() {
  const stems = useBouquetStore((state) => state.stems)

  if (stems.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted">No hay tallos en el ramo.</p>
        <Link href="/" className="text-accent underline">
          Vuelve a montar tu ramo
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-24 md:pb-0">
      <div className="no-print flex items-center justify-between">
        <Link href="/" className="text-accent underline text-[13px]">
          ← Volver
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <CopyShareLinkButton />
          <ExportPngButton />
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-md border border-line text-[13px]"
          >
            Imprimir
          </button>
        </div>
      </div>
      <ShoppingList />
      <CompositionValidator />
      <AssemblyDiagram />

      <div className="no-print md:hidden fixed inset-x-0 bottom-0 flex gap-2 px-4 py-3 border-t border-line bg-surface">
        <CopyShareLinkButton />
        <ExportPngButton />
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-md border border-line text-[13px]"
        >
          Imprimir
        </button>
      </div>
    </div>
  )
}
