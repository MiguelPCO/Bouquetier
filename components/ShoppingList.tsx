'use client'

import { useMemo } from 'react'
import { useBouquetStore } from '@/store/bouquet'
import { buildShoppingList, totalCost } from '@/lib/shoppingList'
import type { Role } from '@/lib/species'

const ROLE_LABEL: Record<Role, string> = {
  focal: 'Focal',
  secondary: 'Secundaria',
  filler: 'Relleno',
  green: 'Verde',
}

const ROLES: Role[] = ['focal', 'secondary', 'filler', 'green']

export function ShoppingList() {
  const stems = useBouquetStore((state) => state.stems)
  const lines = useMemo(() => buildShoppingList(stems), [stems])
  const total = useMemo(() => totalCost(lines), [lines])

  return (
    <section className="space-y-3">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted">Lista de la compra</h2>
      {ROLES.map((role) => {
        const roleLines = lines.filter((line) => line.role === role)
        if (roleLines.length === 0) return null
        return (
          <div key={role}>
            <h3 className="text-[11px] font-medium text-muted mb-1">{ROLE_LABEL[role]}</h3>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="text-[10.5px] text-muted text-left">
                  <th className="py-1 font-normal">Especie</th>
                  <th className="py-1 font-normal text-center w-10">Uds.</th>
                  <th className="py-1 font-normal text-right w-16">Precio</th>
                  <th className="py-1 font-normal text-right w-16">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {roleLines.map((line) => (
                  <tr key={line.speciesId} className="border-b border-line align-top">
                    <td className="py-1">
                      {line.name}
                      {!line.inSeason && <span className="ml-1.5 text-[10px] text-warn">fuera de temporada</span>}
                      {!line.inSeason && line.substitutes.length > 0 && (
                        <div className="text-[10.5px] text-muted italic">
                          {line.substitutes.length > 1 ? 'Sustitutos' : 'Sustituto'}:{' '}
                          {line.substitutes.map((s) => s.name).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-center w-10">{line.count}</td>
                    <td className="py-1 text-right w-16">{line.unitPrice.toFixed(2)}€</td>
                    <td className="py-1 text-right w-16">{line.subtotal.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })}
      {lines.length === 0 ? (
        <p className="text-[12.5px] text-muted italic">No hay tallos en la lista.</p>
      ) : (
        <p className="text-right font-medium text-[13px]">Total: {total.toFixed(2)}€</p>
      )}
    </section>
  )
}
