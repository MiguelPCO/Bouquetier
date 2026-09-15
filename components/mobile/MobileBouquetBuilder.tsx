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

  const activeIndex = ROLE_ORDER.indexOf(active)
  const prevRole = ROLE_ORDER[(activeIndex - 1 + ROLE_ORDER.length) % ROLE_ORDER.length]!
  const nextRole = ROLE_ORDER[(activeIndex + 1) % ROLE_ORDER.length]!

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none h-[34dvh] overflow-hidden flex items-center justify-center pt-1">
        <div className="w-full max-w-[min(100%,30dvh)]">
          <BouquetCanvas />
        </div>
      </div>

      <div className="flex-none flex flex-col items-center gap-1 py-1.5">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => scrollToRole(prevRole)}
            aria-label={`Ir a ${ROLE_LABEL[prevRole]}`}
            className="px-2 py-2 text-muted text-[11px] font-mono uppercase tracking-wide"
          >
            <span aria-hidden>‹</span> {ROLE_LABEL[prevRole]}
          </button>
          <span className="font-display text-lg font-bold text-accent min-w-[6.5rem] text-center">
            {ROLE_LABEL[active]}
          </span>
          <button
            type="button"
            onClick={() => scrollToRole(nextRole)}
            aria-label={`Ir a ${ROLE_LABEL[nextRole]}`}
            className="px-2 py-2 text-muted text-[11px] font-mono uppercase tracking-wide"
          >
            {ROLE_LABEL[nextRole]} <span aria-hidden>›</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {ROLE_ORDER.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => scrollToRole(role)}
              aria-label={`Ir a ${ROLE_LABEL[role]}`}
              aria-current={active === role}
              className="p-2 -m-2"
            >
              <span className={`block w-1.5 h-1.5 rounded-full ${active === role ? 'bg-accent' : 'bg-line'}`} />
            </button>
          ))}
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
            className="flex-none w-full h-full flex flex-col snap-start overflow-y-auto px-4"
          >
            <div className="grid grid-cols-3 gap-1.5 pb-1.5">
              {SPECIES_BY_ROLE[role].map((sp) => (
                <div key={sp.id} className="bg-surface border border-line rounded-xl p-1 text-center">
                  <span
                    className="block w-7 h-7 rounded-full border border-line mx-auto mb-1"
                    style={{ background: sp.color }}
                  />
                  <span className="block text-[10.5px] font-medium leading-tight truncate">{sp.name}</span>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button
                      type="button"
                      className="w-9 h-9 -m-1.5 flex items-center justify-center disabled:opacity-30"
                      onClick={() => remove(sp.id)}
                      disabled={!counts[sp.id]}
                      aria-label={`Quitar ${sp.name}`}
                    >
                      <span className="w-[20px] h-[20px] border border-line rounded flex items-center justify-center text-[11px]">
                        −
                      </span>
                    </button>
                    <span className="font-mono text-[10px] w-3 text-center">{counts[sp.id] ?? 0}</span>
                    <button
                      type="button"
                      className="w-9 h-9 -m-1.5 flex items-center justify-center"
                      onClick={() => add(sp)}
                      aria-label={`Añadir ${sp.name}`}
                    >
                      <span className="w-[20px] h-[20px] rounded bg-accent text-surface flex items-center justify-center text-[11px]">
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
    </div>
  )
}
