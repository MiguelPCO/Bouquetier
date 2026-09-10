import { SPECIES, type Species, type Stem } from './species'

export function encodeShareLink(stems: Stem[]): string {
  const counts = new Map<string, number>()
  for (const stem of stems) {
    counts.set(stem.species.id, (counts.get(stem.species.id) ?? 0) + 1)
  }
  return [...counts.entries()].map(([id, count]) => `${id}:${count}`).join(',')
}

export function decodeShareLink(param: string | null | undefined): Stem[] {
  if (!param) return []

  const bySpecies = new Map(SPECIES.map((s) => [s.id, s]))
  const stems: Stem[] = []
  let nextUid = 1

  for (const pair of param.split(',')) {
    const [id, countRaw] = pair.split(':')
    if (!id || countRaw === undefined) continue

    const species = bySpecies.get(id)
    if (!species) continue

    const count = Number(countRaw)
    if (!Number.isFinite(count) || count <= 0) continue

    for (let i = 0; i < Math.floor(count); i++) {
      stems.push({ uid: nextUid++, species })
    }
  }

  return stems
}

function speciesNamesInOrder(stems: Stem[]): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const stem of stems) {
    if (seen.has(stem.species.id)) continue
    seen.add(stem.species.id)
    names.push(stem.species.name)
  }
  return names
}

function joinWithY(names: string[]): string {
  if (names.length === 1) return names[0]!
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function describeShareBouquet(stems: Stem[]): { title: string; description: string } {
  const title = 'Bouquetier'

  if (stems.length === 0) {
    return { title, description: 'Compón un ramo y obtén la lista de la compra y el diagrama de montaje.' }
  }

  const names = speciesNamesInOrder(stems)
  const shown = names.slice(0, 3)
  const rest = names.length - shown.length

  const list = rest > 0 ? `${shown.join(', ')} y ${rest} más` : joinWithY(shown)

  return { title, description: `${list} — mira este ramo` }
}

export type { Species }
