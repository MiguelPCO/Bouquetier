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
        return
      } catch (error) {
        // Sólo el cierre del share-sheet por parte del usuario se ignora en silencio.
        if (error instanceof Error && error.name === 'AbortError') return
        // Cualquier otro fallo (permisos, share no soportado para estos datos, etc.) cae
        // al portapapeles en vez de dejar al usuario sin ninguna respuesta.
      }
    }

    // `navigator.clipboard` es undefined en orígenes inseguros (HTTP no-localhost); sin
    // esta guarda el await lanzaría un rejection sin ningún feedback.
    if (!navigator.clipboard) return
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
