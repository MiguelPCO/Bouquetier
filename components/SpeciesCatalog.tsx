// components/SpeciesCatalog.tsx
'use client'

import { SPECIES_BY_ROLE, type Role } from '@/lib/species'
import { useBouquetStore } from '@/store/bouquet'

const ROLE_LABEL: Record<Role, string> = {
  focal: 'Focal',
  secondary: 'Secundaria',
  filler: 'Relleno',
  green: 'Verde',
}

const ROLES: Role[] = ['focal', 'secondary', 'filler', 'green']

export function SpeciesCatalog() {
  const stems = useBouquetStore((state) => state.stems)
  const add = useBouquetStore((state) => state.add)
  const remove = useBouquetStore((state) => state.remove)

  const counts: Record<string, number> = {}
  for (const stem of stems) {
    counts[stem.species.id] = (counts[stem.species.id] ?? 0) + 1
  }

  return (
    <div className="space-y-6">
      {ROLES.map((role) => (
        <div key={role}>
          <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted mb-2">{ROLE_LABEL[role]}</p>
          {SPECIES_BY_ROLE[role].map((sp) => (
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
        </div>
      ))}
    </div>
  )
}
