// components/BouquetCanvas.tsx
'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useBouquetStore } from '@/store/bouquet'
import { BouquetSvg } from './BouquetSvg'
import { layout, autoDensity, DEFAULT_COMPOSITION, BOUQUET_VIEWBOX } from '@/lib/vogel'
import { diffStemUids } from '@/lib/animationDiff'
import type { Stem } from '@/lib/species'

gsap.registerPlugin(useGSAP)

// Same coordinate frame as BouquetSvg, so the empty state and the drawn bouquet occupy
// exactly the same box and the layout doesn't jump when the first stem is added.
const VIEWBOX = `${BOUQUET_VIEWBOX.x} ${BOUQUET_VIEWBOX.y} ${BOUQUET_VIEWBOX.width} ${BOUQUET_VIEWBOX.height}`
const TWEEN_DURATION = 0.25
const TWEEN_EASE = 'power2.out'

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mql.matches)
    const onChange = () => setReduced(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return reduced
}

// zustand's `persist` middleware resolves hydration from localStorage through a `.then()`
// chain that, for genuinely synchronous storage (real `localStorage`), often runs to
// completion synchronously — but React's `useSyncExternalStore` (which powers the store hook)
// still deliberately renders the pre-hydration snapshot first on the client, to match the
// server-rendered HTML, before correcting to the real client state on a follow-up render. So
// `stems` is `[]` on that first render regardless of how fast hydration itself resolves —
// seeding anything from it before hydration lands would treat every persisted stem as "new"
// once the corrected snapshot arrives. This hook lets BouquetCanvas wait for that real
// hydrated data before seeding its animation baseline.
//
// The initial state is a plain `false`, not `useBouquetStore.persist.hasHydrated()`: on the
// server, `window` doesn't exist, so the default `createJSONStorage(() => window.localStorage)`
// throws, is swallowed, and `persist` middleware never attaches `.persist` to the store at all
// — reading it during SSR render (outside an effect) throws "Cannot read properties of
// undefined (reading 'hasHydrated')" and 500s every page load. Effects never run on the server,
// so deferring the `.persist` read into the effect below is crash-safe for SSR — but `.persist`
// can ALSO be `undefined` on the *client*: the same `createJSONStorage` swallow happens for real
// in Chrome with "block all site data", inside a sandboxed iframe, or in some private-browsing
// modes, whenever `window.localStorage` itself throws on access. The effect below checks for
// `.persist`'s presence (not just defers reading it) and, if it's missing, resolves `hydrated`
// to `true` immediately — there's no persisted storage to wait for, so treating "no persist" the
// same as "hydration already finished" is correct and, critically, still lets the seed effect
// run (an unguarded optional-chain read here would leave `hydrated` stuck at `false` forever,
// which is worse than the crash: the seed effect would never run, `displayStems` would stay `[]`
// forever, and the whole canvas would silently ignore every add).
function useHasHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    const persistApi = useBouquetStore.persist
    if (!persistApi) {
      setHydrated(true)
      return
    }
    if (persistApi.hasHydrated()) {
      setHydrated(true)
      return
    }
    return persistApi.onFinishHydration(() => setHydrated(true))
  }, [])
  return hydrated
}

export function BouquetCanvas() {
  const stems = useBouquetStore((state) => state.stems)
  const hydrated = useHasHydrated()
  // The mobile and desktop layouts render their own BouquetCanvas simultaneously (one
  // `md:hidden`, the other `hidden md:...`) — see FlowerHeadProps.instanceId for why each
  // instance needs a distinct id namespace for its gradients.
  // `useId()`'s raw value (e.g. `:r0:`) is valid in an id/url(#...) reference, but stripped
  // to plain word characters here to avoid relying on that edge case.
  const instanceId = useId().replace(/[^a-zA-Z0-9]/g, '')
  // MUST start empty (`[]`), never eagerly seeded from `stems` here: `stems` can still be the
  // pre-hydration snapshot on this first render (see `useHasHydrated` above), and seeding from
  // it directly — bypassing the seed effect below — is exactly the bug this file works around.
  // In dev-only StrictMode double-render/double-effect replay, seeding here instead of in the
  // effect would show every persisted stem flying in from the canvas center, but ONLY in dev,
  // making it a nasty regression to chase without this note.
  const [displayStems, setDisplayStems] = useState<Stem[]>([])
  const groupRefs = useRef(new Map<number, SVGGElement>())
  // Stems already present on first hydrated render sit at their final position with no
  // entrance tween (opening a shared link shouldn't animate the whole bouquet popping in) —
  // only stems added after that get the enter animation. Seeded once hydration lands (see the
  // effect below), not eagerly at declaration time, since `stems` is `[]` pre-hydration.
  const enteredUidsRef = useRef(new Set<number>())
  // Which uids have ever had a pose (x/y/scale) applied to their <g> by GSAP in this component
  // instance's lifetime — distinct from `enteredUidsRef`. A hydration-seeded stem is already in
  // `enteredUidsRef` (skip its fade-in) but its <g> is a brand-new DOM node GSAP has never
  // touched, so the "reflow" branch's `gsap.to(el, {x, y, scale, ...})` would tween it FROM the
  // browser's default identity transform (0,0, scale 1) — visible as every existing stem flying
  // in from the canvas center on reload, since `useGSAP` runs as a layout effect (before paint),
  // so that wrong starting pose is exactly what the browser's first frame shows. Any uid not yet
  // in this set gets an instant `gsap.set` to its real pose instead of a tween, whether or not
  // it's also in `enteredUidsRef`; only a stem positioned at least once already reflows smoothly.
  const positionedUidsRef = useRef(new Set<number>())
  // Uids currently mid-exit-tween. A stem stays in `displayStems`/`placed` for the whole exit
  // duration (see the store-sync effect below), so if the user adds or removes another stem
  // while an exit is still animating, `placed` changes and the entrance/reflow `useGSAP` effect
  // below re-runs for every stem including the exiting one. Without this guard it would fall
  // into the reflow branch, creating a `gsap.to({x, y, scale, ...})` tween that — being created
  // after the exit tween — wins the fight over `scale` in the same tick: the stem would snap
  // back to full size and pop out of the DOM instead of shrinking away. Checked before
  // `enteredUidsRef` in the loop below so an exiting uid is skipped entirely, whether or not it
  // was also removed from `enteredUidsRef` already (see `finishExit`).
  const exitingUidsRef = useRef(new Set<number>())
  // The exact `stems` array reference the seed effect below last seeded `displayStems` from.
  // `hydrated` flipping true and `stems` landing its real hydrated value can commit together in
  // the very same React commit (React re-renders with the corrected `useSyncExternalStore`
  // snapshot in the same pass hydration finishes), which runs the seed effect and the
  // store-sync effect below in the same passive-effect flush, in declaration order. Guarding
  // the store-sync effect with only a "have we seeded" flag isn't enough: the seed effect sets
  // that flag synchronously before the store-sync effect's guard even checks it, so the guard
  // never trips, and the store-sync effect then diffs against `displayStems` from this render's
  // (pre-seed) closure — still `[]` — against the now-hydrated `stems`, computing every stem as
  // "entering" and appending them on top of what the seed effect just set, doubling the
  // bouquet with duplicate uids (and the React "two children with the same key" warning that
  // comes with it). Comparing `stems` against the exact reference last seeded — rather than a
  // one-shot flag — tolerates this same-commit case (and any StrictMode replay of it) without
  // ever swallowing a later, genuinely new `stems` reference from a real add/remove. Also
  // doubles as the "have we seeded yet" flag: seeding has happened iff this is non-null.
  const lastSeededStemsRef = useRef<Stem[] | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  // Seed the animation baseline exactly once, when the persisted store has actually finished
  // hydrating — using the real hydrated `stems`, not the empty pre-hydration array.
  useEffect(() => {
    if (!hydrated || lastSeededStemsRef.current !== null) return
    lastSeededStemsRef.current = stems
    enteredUidsRef.current = new Set(stems.map((s) => s.uid))
    setDisplayStems(stems)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated])

  const placed = useMemo(
    () => layout(displayStems, { ...DEFAULT_COMPOSITION, density: autoDensity(displayStems) }),
    [displayStems]
  )

  // Sync the store into displayStems. Additions land immediately (so their <g> mounts and can
  // be ref'd for the entrance tween in the effect below). Removals stay in displayStems, still
  // rendered, until their exit tween finishes — that's what lets a removed stem visibly shrink
  // away instead of vanishing the instant the store drops it.
  useEffect(() => {
    if (lastSeededStemsRef.current === null || stems === lastSeededStemsRef.current) return
    // Assumes `uid` is a stable identity across renders and that `species` never changes for a
    // given `uid` while it's mounted. True for `store.add`/`store.remove` — uids are never
    // reused, per `store/bouquet.ts`'s monotonic `nextUid` — but NOT in general for
    // `lib/shareLink.ts`'s `decodeShareLink`, which renumbers uids from 1 on every decode.
    // Currently safe only because `ShareLinkSync`'s `setStems` call lands before this
    // component's hydration-seed effect can run stale data against it; worth flagging in case
    // that ordering ever changes.
    const { entering, exiting } = diffStemUids(
      displayStems.map((s) => s.uid),
      stems.map((s) => s.uid)
    )
    if (entering.length === 0 && exiting.length === 0) return

    if (entering.length > 0) {
      const enteringSet = new Set(entering)
      const newStems = stems.filter((s) => enteringSet.has(s.uid))
      setDisplayStems((prev) => [...prev, ...newStems])
    }

    if (exiting.length > 0) {
      if (reducedMotion) {
        for (const uid of exiting) {
          enteredUidsRef.current.delete(uid)
          positionedUidsRef.current.delete(uid)
        }
        setDisplayStems(stems)
      } else {
        let pending = exiting.length
        const exitingSet = new Set(exiting)
        const finishExit = (uid: number) => {
          enteredUidsRef.current.delete(uid)
          positionedUidsRef.current.delete(uid)
          exitingUidsRef.current.delete(uid)
          pending -= 1
          if (pending === 0) {
            setDisplayStems((prev) => prev.filter((s) => !exitingSet.has(s.uid)))
          }
        }
        for (const uid of exiting) {
          exitingUidsRef.current.add(uid)
          const el = groupRefs.current.get(uid)
          if (!el) {
            finishExit(uid)
            continue
          }
          gsap.to(el, {
            scale: 0,
            opacity: 0,
            duration: TWEEN_DURATION,
            ease: 'power2.in',
            onComplete: () => finishExit(uid),
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stems])

  // Entrance + reflow. Fires whenever `placed` changes — including the render right after the
  // effect above grows displayStems, once the new stem's <g> actually exists in the DOM.
  useGSAP(
    () => {
      for (const stem of placed) {
        if (exitingUidsRef.current.has(stem.uid)) continue

        const el = groupRefs.current.get(stem.uid)
        if (!el) continue

        const isFirstPose = !positionedUidsRef.current.has(stem.uid)
        positionedUidsRef.current.add(stem.uid)

        if (!enteredUidsRef.current.has(stem.uid)) {
          enteredUidsRef.current.add(stem.uid)
          gsap.set(el, {
            x: stem.x,
            y: stem.y,
            scale: reducedMotion ? stem.scale : 0,
            opacity: reducedMotion ? 1 : 0,
          })
          if (!reducedMotion) {
            gsap.to(el, { scale: stem.scale, opacity: 1, duration: TWEEN_DURATION, ease: TWEEN_EASE })
          }
        } else if (reducedMotion || isFirstPose) {
          gsap.set(el, { x: stem.x, y: stem.y, scale: stem.scale, opacity: 1 })
        } else {
          gsap.to(el, { x: stem.x, y: stem.y, scale: stem.scale, duration: TWEEN_DURATION, ease: TWEEN_EASE })
        }
      }
    },
    // `revertOnUpdate` is deliberately omitted: `@gsap/react`'s default with a non-empty
    // `dependencies` array is to NOT revert the GSAP context on a dependency change, only on
    // unmount — this is load-bearing, since every stem's pose is set imperatively via
    // `gsap.set`/`gsap.to` on refs rather than derived from React state on each render. If a
    // future edit added `revertOnUpdate: true` here, every stem would snap back to its
    // pre-GSAP origin on every `placed` change instead of holding its animated position.
    { dependencies: [placed, reducedMotion], scope: containerRef }
  )

  return (
    <div ref={containerRef} className="w-full h-auto">
      {displayStems.length === 0 ? (
        <svg viewBox={VIEWBOX} className="w-full h-auto" role="img" aria-label="Vista previa del ramo">
          <text x="0" y="-110" textAnchor="middle" className="fill-muted font-display italic text-[14px]">
            Añade una flor focal para empezar
          </text>
        </svg>
      ) : (
        <BouquetSvg
          stems={displayStems}
          instanceId={instanceId}
          getGroupRef={(uid) => (el: SVGGElement | null) => {
            if (el) groupRefs.current.set(uid, el)
            else groupRefs.current.delete(uid)
          }}
        />
      )}
    </div>
  )
}
