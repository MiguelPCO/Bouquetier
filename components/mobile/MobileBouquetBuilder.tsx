'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { useBouquetStore } from '@/store/bouquet'
import { SPECIES_BY_ROLE, type Role } from '@/lib/species'
import { resolveActiveCategory, type PanelVisibility } from '@/lib/categorySwipe'

const ROLE_ORDER: Role[] = ['focal', 'secondary', 'filler', 'green']

const ROLE_LABEL: Record<Role, string> = {
  focal: 'Focal',
  secondary: 'Secundaria',
  filler: 'Relleno',
  green: 'Verde',
}

export function MobileBouquetBuilder() {
  const stems = useBouquetStore((state) => state.stems)
  const add = useBouquetStore((state) => state.add)
  const remove = useBouquetStore((state) => state.remove)

  const [active, setActive] = useState<Role>('focal')
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef(new Map<Role, HTMLDivElement>())

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const ratios = new Map<Role, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const role = (entry.target as HTMLElement).dataset.role as Role
          ratios.set(role, entry.intersectionRatio)
        }
        const panels: PanelVisibility[] = ROLE_ORDER.map((role) => ({
          role,
          intersectionRatio: ratios.get(role) ?? 0,
        }))
        setActive((prev) => resolveActiveCategory(panels, prev))
      },
      { root: container, threshold: [0, 0.25, 0.5, 0.75, 1] }
    )

    for (const el of panelRefs.current.values()) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const scrollToRole = useCallback((role: Role) => {
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panelRefs.current
      .get(role)
      ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', inline: 'start', block: 'nearest' })
  }, [])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const stem of stems) c[stem.species.id] = (c[stem.species.id] ?? 0) + 1
    return c
  }, [stems])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none h-[60dvh] overflow-hidden flex items-center justify-center pt-1">
        <div className="w-full max-w-[min(100%,53dvh)]">
          <BouquetCanvas />
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory motion-safe:scroll-smooth"
      >
        {ROLE_ORDER.map((role) => (
          <div
            key={role}
            data-role={role}
            ref={(el) => {
              if (el) panelRefs.current.set(role, el)
              else panelRefs.current.delete(role)
            }}
            className="flex-none w-full snap-start overflow-y-auto px-4 pb-4"
          >
            <div className="grid grid-cols-3 gap-3">
              {SPECIES_BY_ROLE[role].map((sp) => (
                <div key={sp.id} className="bg-surface border border-line rounded-2xl p-2.5 text-center">
                  <span
                    className="block w-10 h-10 rounded-full border border-line mx-auto mb-2"
                    style={{ background: sp.color }}
                  />
                  <span className="block text-[12px] font-medium">{sp.name}</span>
                  <span className="block font-display italic text-[9.5px] text-muted mb-2">{sp.latin}</span>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      className="w-11 h-11 -m-2.5 flex items-center justify-center disabled:opacity-30"
                      onClick={() => remove(sp.id)}
                      disabled={!counts[sp.id]}
                      aria-label={`Quitar ${sp.name}`}
                    >
                      <span className="w-[22px] h-[22px] border border-line rounded flex items-center justify-center">
                        −
                      </span>
                    </button>
                    <span className="font-mono text-[11px] w-3.5 text-center">{counts[sp.id] ?? 0}</span>
                    <button
                      type="button"
                      className="w-11 h-11 -m-2.5 flex items-center justify-center"
                      onClick={() => add(sp)}
                      aria-label={`Añadir ${sp.name}`}
                    >
                      <span className="w-[22px] h-[22px] rounded bg-accent text-surface flex items-center justify-center">
                        +
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-none flex border-t border-line bg-surface px-2.5 py-2">
        {ROLE_ORDER.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => scrollToRole(role)}
            aria-pressed={active === role}
            className={`flex-1 text-center font-mono text-[10.5px] py-3 rounded-lg ${
              active === role ? 'bg-accent text-surface' : 'text-muted'
            }`}
          >
            {ROLE_LABEL[role]}
          </button>
        ))}
      </div>
    </div>
  )
}
