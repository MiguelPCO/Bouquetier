import type { Stem } from './species'
import { colorFamily } from './species'

export interface ValidationResult {
  rule: 'role-balance' | 'season' | 'color-clash'
  message: string
}

export function validateComposition(stems: Stem[], month = new Date().getMonth() + 1): ValidationResult[] {
  if (stems.length === 0) return []

  const results: ValidationResult[] = []

  const hasFocal = stems.some((stem) => stem.species.role === 'focal')
  if (!hasFocal) {
    results.push({
      rule: 'role-balance',
      message: 'La composición no tiene ninguna flor focal.',
    })
  }

  const roleCounts = new Map<string, number>()
  for (const stem of stems) {
    roleCounts.set(stem.species.role, (roleCounts.get(stem.species.role) ?? 0) + 1)
  }
  for (const [role, count] of roleCounts) {
    if (count / stems.length > 0.7) {
      results.push({
        rule: 'role-balance',
        message: `El rol "${role}" representa más del 70% de los tallos.`,
      })
    }
  }

  const outOfSeason = stems.filter((stem) => !stem.species.season.includes(month))
  if (outOfSeason.length > 0) {
    const names = Array.from(new Set(outOfSeason.map((stem) => stem.species.name)))
    results.push({
      rule: 'season',
      message: `Fuera de temporada: ${names.join(', ')}.`,
    })
  }

  const families = new Set(stems.map((stem) => colorFamily(stem.species)))
  if (families.size > 4) {
    results.push({
      rule: 'color-clash',
      message: 'Más de 4 familias de color distintas — riesgo de sobrecarga visual.',
    })
  }

  return results
}
