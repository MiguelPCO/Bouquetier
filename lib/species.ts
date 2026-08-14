export type Role = 'focal' | 'secondary' | 'filler' | 'green'
export type Shape = 'peony' | 'dahlia' | 'ranun' | 'tulip' | 'umbel' | 'spray' | 'leaf' | 'spike'

export interface Species {
  id: string
  name: string
  latin: string
  role: Role
  shape: Shape
  color: string
  lengthCm: number
  headMm: number
  wholesale: number
  season: number[]
  vaseDays: number
  dry: boolean
}

export interface Stem {
  uid: number
  species: Species
}

export const SPECIES: Species[] = [
  { id: 'peony',   name: 'Peonía',         latin: 'Paeonia lactiflora',     role: 'focal',     shape: 'peony',  color: 'oklch(0.794 0.0761 10.6)',  lengthCm: 65, headMm: 120, wholesale: 3.10, season: [4, 5, 6],                          vaseDays: 6,  dry: false },
  { id: 'dahlia',  name: 'Dalia',          latin: 'Dahlia pinnata',         role: 'focal',     shape: 'dahlia', color: 'oklch(0.7429 0.111 32.9)',  lengthCm: 60, headMm: 100, wholesale: 2.40, season: [7, 8, 9, 10],                       vaseDays: 5,  dry: false },
  { id: 'grose',   name: 'Rosa inglesa',   latin: 'Rosa × centifolia',      role: 'focal',     shape: 'peony',  color: 'oklch(0.9268 0.0222 63.2)', lengthCm: 60, headMm: 85,  wholesale: 2.80, season: [5, 6, 7, 8, 9],                     vaseDays: 7,  dry: false },
  { id: 'ranun',   name: 'Ranúnculo',      latin: 'Ranunculus asiaticus',   role: 'secondary', shape: 'ranun',  color: 'oklch(0.8319 0.0682 2.4)',  lengthCm: 45, headMm: 55,  wholesale: 1.60, season: [2, 3, 4, 5],                        vaseDays: 7,  dry: false },
  { id: 'tulip',   name: 'Tulipán',        latin: 'Tulipa gesneriana',      role: 'secondary', shape: 'tulip',  color: 'oklch(0.592 0.1809 27.6)',  lengthCm: 45, headMm: 55,  wholesale: 0.90, season: [1, 2, 3, 4, 11, 12],                vaseDays: 6,  dry: false },
  { id: 'anemone', name: 'Anémona',        latin: 'Anemone coronaria',      role: 'secondary', shape: 'ranun',  color: 'oklch(0.9601 0.0108 76.6)', lengthCm: 40, headMm: 60,  wholesale: 1.35, season: [1, 2, 3, 10, 11, 12],               vaseDays: 6,  dry: false },
  { id: 'wax',     name: 'Flor de cera',   latin: 'Chamelaucium uncinatum', role: 'filler',    shape: 'umbel',  color: 'oklch(0.7366 0.0995 0.9)',  lengthCm: 60, headMm: 100, wholesale: 1.10, season: [3, 4, 5, 6],                        vaseDays: 12, dry: true },
  { id: 'gyps',    name: 'Paniculata',     latin: 'Gypsophila paniculata',  role: 'filler',    shape: 'spray',  color: 'oklch(0.9778 0.0079 73.7)', lengthCm: 70, headMm: 140, wholesale: 0.85, season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 10, dry: true },
  { id: 'corn',    name: 'Aciano',         latin: 'Centaurea cyanus',       role: 'filler',    shape: 'umbel',  color: 'oklch(0.6626 0.1056 271)',  lengthCm: 50, headMm: 35,  wholesale: 0.95, season: [5, 6, 7, 8],                        vaseDays: 5,  dry: true },
  { id: 'euca',    name: 'Eucalipto',      latin: 'Eucalyptus cinerea',     role: 'green',     shape: 'leaf',   color: 'oklch(0.6933 0.04 141.5)',  lengthCm: 70, headMm: 130, wholesale: 1.20, season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 14, dry: true },
  { id: 'ruscus',  name: 'Rusco',          latin: 'Ruscus hypophyllum',     role: 'green',     shape: 'leaf',   color: 'oklch(0.5458 0.0659 139.7)', lengthCm: 60, headMm: 110, wholesale: 0.80, season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 21, dry: true },
  { id: 'bunny',   name: 'Cola de conejo', latin: 'Lagurus ovatus',         role: 'green',     shape: 'spike',  color: 'oklch(0.8452 0.0416 86.7)', lengthCm: 50, headMm: 45,  wholesale: 0.70, season: [6, 7, 8, 9],                        vaseDays: 30, dry: true },
]

export const SPECIES_BY_ROLE: Record<Role, Species[]> = {
  focal: SPECIES.filter((s) => s.role === 'focal'),
  secondary: SPECIES.filter((s) => s.role === 'secondary'),
  filler: SPECIES.filter((s) => s.role === 'filler'),
  green: SPECIES.filter((s) => s.role === 'green'),
}
