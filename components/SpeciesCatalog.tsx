'use client'

import { useMemo, useState } from 'react'
import { SPECIES, filterSpecies, type ColorFamily, type Role } from '@/lib/species'
import { useBouquetStore } from '@/store/bouquet'

const ROLE_LABEL: Record<Role, string> = {
  focal: 'Focal',
  secondary: 'Secundaria',
  filler: 'Relleno',
  green: 'Verde',
}

const ROLES: Role[] = ['focal', 'secondary', 'filler', 'green']

const COLOR_FAMILY_LABEL: Record<ColorFamily, string> = {
  blanco: 'Blanco',
  rosa: 'Rosa',
  rojo: 'Rojo',
  naranja: 'Naranja',
  amarillo: 'Amarillo',
  verde: 'Verde',
  azul: 'Azul',
  morado: 'Morado',
}

const COLOR_FAMILIES: ColorFamily[] = ['blanco', 'rosa', 'rojo', 'naranja', 'amarillo', 'verde', 'azul', 'morado']

export function SpeciesCatalog() {
  const stems = useBouquetStore((state) => state.stems)
  const add = useBouquetStore((state) => state.add)
  const remove = useBouquetStore((state) => state.remove)

  const [seasonOnly, setSeasonOnly] = useState(false)
  const [activeColors, setActiveColors] = useState<ColorFamily[]>([])

  const toggleColor = (family: ColorFamily) => {
    setActiveColors((prev) => (prev.includes(family) ? prev.filter((f) => f !== family) : [...prev, family]))
  }

  const filtered = useMemo(
    () => filterSpecies(SPECIES, { seasonOnly, colorFamilies: activeColors }),
    [seasonOnly, activeColors]
  )

  const byRole: Record<Role, typeof SPECIES> = {
    focal: filtered.filter((s) => s.role === 'focal'),
    secondary: filtered.filter((s) => s.role === 'secondary'),
    filler: filtered.filter((s) => s.role === 'filler'),
    green: filtered.filter((s) => s.role === 'green'),
  }

  const counts: Record<string, number> = {}
  for (const stem of stems) {
    counts[stem.species.id] = (counts[stem.species.id] ?? 0) + 1
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSeasonOnly((v) => !v)}
          aria-pressed={seasonOnly}
          className={`px-2.5 py-1 rounded-full border text-[11px] font-mono uppercase tracking-[0.06em] ${
            seasonOnly ? 'bg-accent text-surface border-accent' : 'border-line text-muted'
          }`}
        >
          En temporada
        </button>
        {COLOR_FAMILIES.map((family) => (
          <button
            key={family}
            type="button"
            onClick={() => toggleColor(family)}
            aria-pressed={activeColors.includes(family)}
            className={`px-2.5 py-1 rounded-full border text-[11px] ${
              activeColors.includes(family) ? 'bg-accent text-surface border-accent' : 'border-line text-muted'
            }`}
          >
            {COLOR_FAMILY_LABEL[family]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {ROLES.map((role) => (
          <details key={role} open className="group">
            <summary className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted mb-2 cursor-pointer select-none">
              {ROLE_LABEL[role]} ({byRole[role].length})
            </summary>
            {byRole[role].map((sp) => (
              <div key={sp.id} className="flex items-center gap-2 py-1">
                <span className="w-4 h-4 rounded-full border border-line flex-none" style={{ background: sp.color }} />
                <span className="flex-1 min-w-0 leading-tight">
                  <span className="block text-[12.5px] font-medium">{sp.name}</span>
                  <span className="block font-display italic text-[10.5px] text-muted">{sp.latin}</span>
                </span>
                <button
                  type="button"
                  className="w-6 h-6 border border-line rounded disabled:opacity-30"
                  onClick={() => remove(sp.id)}
                  disabled={!counts[sp.id]}
                  aria-label={`Quitar ${sp.name}`}
                >
                  −
                </button>
                <span className="font-mono text-[11.5px] w-4 text-center text-muted">{counts[sp.id] ?? 0}</span>
                <button
                  type="button"
                  className="w-6 h-6 border border-line rounded"
                  onClick={() => add(sp)}
                  aria-label={`Añadir ${sp.name}`}
                >
                  +
                </button>
              </div>
            ))}
            {byRole[role].length === 0 && <p className="text-[11.5px] text-muted italic">Sin resultados con este filtro.</p>}
          </details>
        ))}
      </div>
    </div>
  )
}
