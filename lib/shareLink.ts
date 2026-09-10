import { SPECIES, type Stem } from './species'

/**
 * Hard ceiling on how many stems a share link may reconstruct.
 *
 * `?s=` is untrusted input reachable from three places — `app/api/og/route.ts`,
 * `app/page.tsx`'s `generateMetadata`, and `components/ShareLinkSync.tsx` — so an
 * unbounded count (`?s=peonia:100000000`) would allocate 100M array entries on a plain
 * page load, and additionally feed all of them into SVG generation + `sharp` rasterization
 * on the OG route. A real hand-tied bouquet runs 12-24 stems (`STEM_RANGE` in SCHEMA.md),
 * so 200 is generous for any legitimate link while keeping the worst case cheap.
 *
 * The cap lives inside `decodeShareLink` so all three consumers inherit it automatically.
 */
export const MAX_STEMS = 200

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

    const wanted = Math.min(Math.floor(count), MAX_STEMS - stems.length)
    for (let i = 0; i < wanted; i++) {
      stems.push({ uid: nextUid++, species })
    }
    if (stems.length >= MAX_STEMS) break
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
