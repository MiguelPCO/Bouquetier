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
  // Set for exactly one pass of the write-effect right after the mount-effect decodes
  // `s` into the store. `setStems` updates Zustand, but doesn't synchronously change the
  // `stems` this write-effect closed over during the render that scheduled both effects —
  // so, in the same initial commit, the write-effect would otherwise fire once with the
  // stale pre-load `stems` and clobber the `s` we just read (a spurious/incorrect
  // history.replaceState). Skip that one pass; the store already reflects the decoded URL,
  // so nothing is lost, and the next real stems change writes normally.
  const justLoadedFromUrl = useRef(false)

  useEffect(() => {
    if (hasLoadedFromUrl.current) return
    hasLoadedFromUrl.current = true
    if (s) {
      justLoadedFromUrl.current = true
      setStems(decodeShareLink(s))
    }
    // Only runs once, on mount — deliberately not depending on `s` again after that,
    // so it never re-triggers from the writes the effect below makes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasLoadedFromUrl.current) return
    if (justLoadedFromUrl.current) {
      justLoadedFromUrl.current = false
      return
    }
    const encoded = encodeShareLink(stems)
    setS(encoded.length > 0 ? encoded : null)
  }, [stems, setS])

  return null
}
