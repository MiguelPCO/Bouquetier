// components/ExportPngButton.tsx
'use client'

import { useState } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { downloadBouquetPng } from '@/lib/exportPng'

export function ExportPngButton() {
  const stems = useBouquetStore((state) => state.stems)
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle')

  const handleClick = async () => {
    setStatus('working')
    try {
      await downloadBouquetPng(stems)
      setStatus('idle')
    } catch {
      setStatus('error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={stems.length === 0 || status === 'working'}
      className="px-3 py-1.5 rounded-md border border-line text-[13px] disabled:opacity-40"
    >
      {status === 'working' ? 'Generando…' : status === 'error' ? 'Error, reintentar' : 'Exportar PNG'}
    </button>
  )
}
