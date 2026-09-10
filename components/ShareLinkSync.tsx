// components/ShareLinkSync.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useQueryState } from 'nuqs'
import { useBouquetStore } from '@/store/bouquet'
import { encodeShareLink, decodeShareLink } from '@/lib/shareLink'
import type { Stem } from '@/lib/species'

/** Mounts once on the composer page. Reads `s` from the URL on first load and replaces the
 *  store with it (URL wins over localStorage — see CONTEXT.md's "Enlace compartido"). After
 *  that, every store change re-encodes `s` back into the URL (shallow, replace-in-place). */
export function ShareLinkSync() {
  const [s, setS] = useQueryState('s', { history: 'replace', shallow: true })
  const stems = useBouquetStore((state) => state.stems)
  const setStems = useBouquetStore((state) => state.setStems)

  const hasLoadedFromUrl = useRef(false)
  // Holds the exact array `setStems` was called with while a URL-driven load is in flight,
  // or `null` once no load is pending. Deliberately identity-based rather than a one-shot
  // flag: a flag consumed by the write effect's first pass would stay consumed across any
  // later replay of that same pass with the same stale closure (e.g. React StrictMode's
  // dev-only double-invoke of passive effects), letting a replay slip through and write the
  // stale pre-load `stems` anyway. Comparing `stems !== pendingLoadRef.current` instead
  // tolerates any number of replays: it only turns false once a render genuinely happens
  // with the loaded array (zustand's `setStems` stores that exact array, not a copy, so
  // reference equality reliably detects "has this specific load landed yet").
  const pendingLoadRef = useRef<Stem[] | null>(null)

  useEffect(() => {
    if (hasLoadedFromUrl.current) return
    hasLoadedFromUrl.current = true
    if (s) {
      const decoded = decodeShareLink(s)
      if (decoded.length > 0) {
        pendingLoadRef.current = decoded
        setStems(decoded)
      } else {
        // `s` was present but decoded to nothing (garbage or a truncated link). Calling
        // setStems([]) here would replace the store with an empty bouquet and — via
        // zustand's persist middleware — permanently wipe whatever the recipient had saved
        // in localStorage, with no warning. Leave the store alone and just clear the
        // dangling param so a reload doesn't repeat this.
        setS(null)
      }
    }
    // Only runs once, on mount — deliberately not depending on `s` again after that,
    // so it never re-triggers from the writes the effect below makes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasLoadedFromUrl.current) return

    if (pendingLoadRef.current !== null) {
      // A URL-driven load is pending. Until `stems` is reference-equal to the exact array
      // we decoded, this closure is stale (pre-load) — don't write it. Once it matches, the
      // load has genuinely landed; clear the pending marker and still don't write on this
      // pass (the URL already holds the right value) — only a later real edit should write.
      if (stems !== pendingLoadRef.current) return
      pendingLoadRef.current = null
      return
    }

    const encoded = encodeShareLink(stems)
    setS(encoded.length > 0 ? encoded : null)
  }, [stems, setS])

  return null
}
