import type { Species, Stem, Role } from './species'
import { SPECIES, colorFamily } from './species'

export interface ShoppingListLine {
  speciesId: string
  name: string
  role: Role
  count: number
  unitPrice: number
  subtotal: number
  inSeason: boolean
  substitutes: Species[]
}

function suggestSubstitutes(species: Species, month: number): Species[] {
  const family = colorFamily(species)
  return SPECIES.filter(
    (candidate) =>
      candidate.id !== species.id &&
      candidate.role === species.role &&
      colorFamily(candidate) === family &&
      candidate.season.includes(month)
  )
    .sort((a, b) => Math.abs(a.wholesale - species.wholesale) - Math.abs(b.wholesale - species.wholesale))
    .slice(0, 2)
}

export function buildShoppingList(stems: Stem[], month = new Date().getMonth() + 1): ShoppingListLine[] {
  const counts = new Map<string, { species: Species; count: number }>()
  for (const stem of stems) {
    const entry = counts.get(stem.species.id)
    if (entry) entry.count += 1
    else counts.set(stem.species.id, { species: stem.species, count: 1 })
  }

  return Array.from(counts.values()).map(({ species, count }) => {
    const inSeason = species.season.includes(month)
    return {
      speciesId: species.id,
      name: species.name,
      role: species.role,
      count,
      unitPrice: species.wholesale,
      subtotal: species.wholesale * count,
      inSeason,
      substitutes: inSeason ? [] : suggestSubstitutes(species, month),
    }
  })
}

export function totalCost(lines: ShoppingListLine[]): number {
  return lines.reduce((sum, line) => sum + line.subtotal, 0)
}
