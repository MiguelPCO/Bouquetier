// components/ShareLinkSync.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useQueryState } from 'nuqs'
import { useBouquetStore } from '@/store/bouquet'
import { encodeShareLink, decodeShareLink } from '@/lib/shareLink'

/** Mounts once on the composer page. Reads `s` from the URL on first load and replaces the
 *  store with it (URL wins over localStorage — see CONTEXT.md's "Enlace compartido"). After
 *  that, every store change re-encodes `s` back into the URL (shallow, replace-in-place). */
export function ShareLinkSync() {
  const [s, setS] = useQueryState('s', { history: 'replace', shallow: true })
  const stems = useBouquetStore((state) => state.stems)
  const setStems = useBouquetStore((state) => state.setStems)

  const hasLoadedFromUrl = useRef(false)

  useEffect(() => {
    if (hasLoadedFromUrl.current) return
    hasLoadedFromUrl.current = true
    if (s) {
      setStems(decodeShareLink(s))
    }
    // Only runs once, on mount — deliberately not depending on `s` again after that,
    // so it never re-triggers from the writes the effect below makes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasLoadedFromUrl.current) return
    const encoded = encodeShareLink(stems)
    setS(encoded.length > 0 ? encoded : null)
  }, [stems, setS])

  return null
}
