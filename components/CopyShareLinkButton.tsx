// components/CopyShareLinkButton.tsx
'use client'

import { useState } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { describeShareBouquet } from '@/lib/shareLink'

export function CopyShareLinkButton() {
  const stems = useBouquetStore((state) => state.stems)
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    const url = window.location.href
    const { title, description } = describeShareBouquet(stems)

    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url })
      } catch {
        // El usuario cerró el share-sheet — no es un error a mostrar.
      }
      return
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={stems.length === 0}
      className="px-3 py-1.5 rounded-md border border-line text-[13px] disabled:opacity-40"
    >
      {copied ? '¡Copiado!' : 'Copiar enlace'}
    </button>
  )
}
