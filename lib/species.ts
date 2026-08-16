export type Role = 'focal' | 'secondary' | 'filler' | 'green'
export type Shape = 'peony' | 'dahlia' | 'ranun' | 'tulip' | 'umbel' | 'spray' | 'leaf' | 'spike'
export type ColorFamily = 'blanco' | 'rosa' | 'rojo' | 'naranja' | 'amarillo' | 'verde' | 'azul' | 'morado'

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
  photo?: string
}

export interface Stem {
  uid: number
  species: Species
}

export const SPECIES: Species[] = [
  // focal
  { id: 'peonia',              name: 'Peonía',              latin: 'Paeonia lactiflora',       role: 'focal',     shape: 'peony',  color: 'oklch(0.8234 0.0836 355.8)', lengthCm: 55, headMm: 120, wholesale: 1.50,  season: [4, 5, 6, 7, 8],           vaseDays: 6,  dry: true },
  { id: 'dalia',                name: 'Dalia',               latin: 'Dahlia pinnata',           role: 'focal',     shape: 'dahlia', color: 'oklch(0.6233 0.2119 3.7)',   lengthCm: 48, headMm: 96,  wholesale: 4.31,  season: [5, 6, 7, 8, 9, 10],       vaseDays: 4,  dry: false },
  { id: 'rosa-inglesa',         name: 'Rosa inglesa',        latin: 'Rosa × centifolia',        role: 'focal',     shape: 'peony',  color: 'oklch(0.8711 0.0560 355.5)', lengthCm: 44, headMm: 95,  wholesale: 8.43,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 8,  dry: true },
  { id: 'gerbera',              name: 'Gerbera',             latin: 'Gerbera jamesonii',        role: 'focal',     shape: 'dahlia', color: 'oklch(0.6799 0.1910 43.0)',  lengthCm: 53, headMm: 85,  wholesale: 4.13,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 9,  dry: true },
  { id: 'girasol',              name: 'Girasol',             latin: 'Helianthus annuus',        role: 'focal',     shape: 'dahlia', color: 'oklch(0.8566 0.1655 86.5)',  lengthCm: 61, headMm: 127, wholesale: 0.73,  season: [6, 7, 8, 9, 10],          vaseDays: 8,  dry: true },
  { id: 'lirio-oriental',       name: 'Lirio oriental',      latin: 'Lilium (Oriental hybrid)', role: 'focal',     shape: 'dahlia', color: 'oklch(1.0000 0.0000 89.9)',  lengthCm: 56, headMm: 175, wholesale: 7.36,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 11, dry: false },
  { id: 'amarilis',             name: 'Amarilis',            latin: 'Hippeastrum hybridum',     role: 'focal',     shape: 'umbel',  color: 'oklch(0.5304 0.2074 22.3)',  lengthCm: 58, headMm: 175, wholesale: 16.56, season: [10, 11, 12, 1, 2, 3, 4],  vaseDays: 9,  dry: false },
  { id: 'protea',               name: 'Protea',              latin: 'Protea cynaroides',        role: 'focal',     shape: 'peony',  color: 'oklch(0.6694 0.1422 359.0)', lengthCm: 33, headMm: 150, wholesale: 25.07, season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 14, dry: true },
  { id: 'orquidea-cymbidium',   name: 'Orquídea cymbidium',  latin: 'Cymbidium hybridum',       role: 'focal',     shape: 'spike',  color: 'oklch(0.7737 0.1309 121.1)', lengthCm: 51, headMm: 75,  wholesale: 36.75, season: [10, 11, 12, 1, 2, 3, 4, 5], vaseDays: 12, dry: false },

  // secondary
  { id: 'ranunculo',            name: 'Ranúnculo',           latin: 'Ranunculus asiaticus',     role: 'secondary', shape: 'ranun',  color: 'oklch(0.8001 0.0989 6.8)',   lengthCm: 28, headMm: 38,  wholesale: 4.10,  season: [1, 2, 3, 4, 5, 11, 12],   vaseDays: 6,  dry: true },
  { id: 'tulipan',              name: 'Tulipán',             latin: 'Tulipa gesneriana',        role: 'secondary', shape: 'tulip',  color: 'oklch(0.6122 0.2082 22.2)',  lengthCm: 31, headMm: 63,  wholesale: 3.44,  season: [1, 2, 3, 4, 5, 11, 12],   vaseDays: 6,  dry: false },
  { id: 'anemona',              name: 'Anémona',             latin: 'Anemone coronaria',        role: 'secondary', shape: 'ranun',  color: 'oklch(0.5710 0.2058 21.2)',  lengthCm: 33, headMm: 60,  wholesale: 2.75,  season: [10, 11, 12, 1, 2, 3, 4, 5], vaseDays: 7,  dry: true },
  { id: 'alstroemeria',         name: 'Alstroemeria',        latin: 'Alstroemeria hybrida',     role: 'secondary', shape: 'spray',  color: 'oklch(0.7080 0.1444 0.7)',   lengthCm: 53, headMm: 45,  wholesale: 2.33,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 10, dry: false },
  { id: 'clavel',               name: 'Clavel',              latin: 'Dianthus caryophyllus',    role: 'secondary', shape: 'ranun',  color: 'oklch(0.7289 0.1411 356.7)', lengthCm: 54, headMm: 64,  wholesale: 1.27,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 9,  dry: true },
  { id: 'fresia',               name: 'Fresia',              latin: 'Freesia × hybrida',        role: 'secondary', shape: 'spike',  color: 'oklch(0.8432 0.1494 86.5)',  lengthCm: 28, headMm: 26,  wholesale: 3.30,  season: [1, 2, 3, 4, 5, 10, 11, 12], vaseDays: 9,  dry: true },
  { id: 'lisianthus',           name: 'Lisianthus',          latin: 'Eustoma grandiflorum',     role: 'secondary', shape: 'peony',  color: 'oklch(0.7269 0.0883 304.4)', lengthCm: 46, headMm: 38,  wholesale: 5.98,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 12, dry: true },
  { id: 'iris-holandes',        name: 'Iris holandés',       latin: 'Iris × hollandica',        role: 'secondary', shape: 'spike',  color: 'oklch(0.4635 0.1271 278.6)', lengthCm: 53, headMm: 70,  wholesale: 1.95,  season: [1, 2, 3, 4, 5],           vaseDays: 5,  dry: false },
  { id: 'zinnia',               name: 'Zinnia',              latin: 'Zinnia elegans',           role: 'secondary', shape: 'dahlia', color: 'oklch(0.6408 0.1905 36.4)',  lengthCm: 68, headMm: 110, wholesale: 1.50,  season: [6, 7, 8, 9, 10],          vaseDays: 10, dry: true },

  // filler
  { id: 'flor-de-cera',         name: 'Flor de cera',        latin: 'Chamelaucium uncinatum',   role: 'filler',    shape: 'umbel',  color: 'oklch(0.7964 0.0864 350.3)', lengthCm: 54, headMm: 10,  wholesale: 4.10,  season: [1, 2, 3, 4, 5, 11, 12],   vaseDays: 9,  dry: true },
  { id: 'paniculata',           name: 'Paniculata',          latin: 'Gypsophila paniculata',    role: 'filler',    shape: 'spray',  color: 'oklch(0.9763 0.0070 88.6)',  lengthCm: 51, headMm: 7,   wholesale: 2.30,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 9,  dry: true },
  { id: 'aciano',               name: 'Aciano',              latin: 'Centaurea cyanus',         role: 'filler',    shape: 'dahlia', color: 'oklch(0.6746 0.1414 261.3)', lengthCm: 28, headMm: 40,  wholesale: 2.56,  season: [5, 6, 7, 8, 9],           vaseDays: 5,  dry: true },
  { id: 'limonium',             name: 'Limonium',            latin: 'Limonium sinuatum',        role: 'filler',    shape: 'spray',  color: 'oklch(0.6324 0.1100 291.6)', lengthCm: 59, headMm: 225, wholesale: 1.80,  season: [3, 4, 5, 6, 7, 8],        vaseDays: 8,  dry: true },
  { id: 'solidago',             name: 'Solidago',            latin: 'Solidago canadensis',      role: 'filler',    shape: 'spike',  color: 'oklch(0.7516 0.1469 84.0)',  lengthCm: 48, headMm: 100, wholesale: 1.30,  season: [6, 7, 8, 9, 10],          vaseDays: 11, dry: true },
  { id: 'craspedia',            name: 'Craspedia',           latin: 'Craspedia globosa',        role: 'filler',    shape: 'dahlia', color: 'oklch(0.8399 0.1598 89.2)',  lengthCm: 44, headMm: 25,  wholesale: 2.30,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 9,  dry: true },
  { id: 'astilbe',              name: 'Astilbe',             latin: 'Astilbe × arendsii',       role: 'filler',    shape: 'spike',  color: 'oklch(0.7453 0.1025 354.7)', lengthCm: 38, headMm: 150, wholesale: 2.76,  season: [5, 6, 7, 8, 9, 10],       vaseDays: 6,  dry: true },
  { id: 'ammi-majus',           name: 'Ammi majus',          latin: 'Ammi majus',               role: 'filler',    shape: 'umbel',  color: 'oklch(0.9790 0.0082 91.5)',  lengthCm: 105, headMm: 88, wholesale: 2.85,  season: [5, 6, 7, 8],              vaseDays: 9,  dry: true },
  { id: 'genista',              name: 'Genista',             latin: 'Genista sp.',              role: 'filler',    shape: 'spray',  color: 'oklch(0.8834 0.1626 97.0)',  lengthCm: 41, headMm: 150, wholesale: 5.94,  season: [12, 1, 2, 3],             vaseDays: 9,  dry: true },

  // green
  { id: 'eucalipto',            name: 'Eucalipto',           latin: 'Eucalyptus cinerea',       role: 'green',     shape: 'leaf',   color: 'oklch(0.7089 0.0328 164.9)', lengthCm: 51, headMm: 150, wholesale: 3.20,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 9,  dry: true },
  { id: 'rusco',                name: 'Rusco',               latin: 'Ruscus hypophyllum',       role: 'green',     shape: 'leaf',   color: 'oklch(0.4027 0.0657 146.9)', lengthCm: 60, headMm: 50,  wholesale: 0.55,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 26, dry: true },
  { id: 'cola-de-conejo',       name: 'Cola de conejo',      latin: 'Lagurus ovatus',           role: 'green',     shape: 'spike',  color: 'oklch(0.8484 0.0302 75.6)',  lengthCm: 45, headMm: 20,  wholesale: 0.70,  season: [4, 5, 6, 7, 8, 9, 10],    vaseDays: 12, dry: true },
  { id: 'helecho-cuero',        name: 'Helecho cuero',       latin: 'Rumohra adiantiformis',    role: 'green',     shape: 'leaf',   color: 'oklch(0.3221 0.0538 149.3)', lengthCm: 46, headMm: 175, wholesale: 1.25,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 11, dry: true },
  { id: 'salal',                name: 'Salal',               latin: 'Gaultheria shallon',       role: 'green',     shape: 'leaf',   color: 'oklch(0.4469 0.0730 144.2)', lengthCm: 46, headMm: 80,  wholesale: 1.15,  season: [1, 2, 3, 4, 5, 9, 10, 11, 12], vaseDays: 11, dry: true },
  { id: 'pitosporo',            name: 'Pitosporo',           latin: 'Pittosporum tenuifolium',  role: 'green',     shape: 'leaf',   color: 'oklch(0.5475 0.0575 144.7)', lengthCm: 46, headMm: 100, wholesale: 1.15,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 11, dry: false },
  { id: 'aspidistra',           name: 'Aspidistra',          latin: 'Aspidistra elatior',       role: 'green',     shape: 'leaf',   color: 'oklch(0.3369 0.0671 144.5)', lengthCm: 59, headMm: 125, wholesale: 2.76,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 12, dry: true },
  { id: 'esparrago-plumoso',    name: 'Espárrago plumoso',   latin: 'Asparagus setaceus',       role: 'green',     shape: 'spray',  color: 'oklch(0.4855 0.0729 151.4)', lengthCm: 61, headMm: 200, wholesale: 0.88,  season: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], vaseDays: 14, dry: true },
]

export const SPECIES_BY_ROLE: Record<Role, Species[]> = {
  focal: SPECIES.filter((s) => s.role === 'focal'),
  secondary: SPECIES.filter((s) => s.role === 'secondary'),
  filler: SPECIES.filter((s) => s.role === 'filler'),
  green: SPECIES.filter((s) => s.role === 'green'),
}

/**
 * Wholesale-price and botanical-data sources per species, keyed by id.
 * Research date 2026-08-15. Full methodology, ranges, and confidence flags:
 * docs/superpowers/research/2026-08-15-species-catalog-research.md
 *
 * priceBasis: NL-auction = genuine Dutch auction figure. EU/US-wholesaler = florist-supply
 * proxy (USD converted at ~0.92 EUR). estimate = no wholesale source found, prior-sprint or
 * compiler estimate carried forward, flagged explicitly rather than hidden.
 */
export const SPECIES_SOURCES: Record<string, { price: string; botany: string; priceBasis: string; note?: string }> = {
  'peonia':             { price: 'https://aiph.org/floraculture/news/peony-continues-its-rise-to-prominence/', botany: 'https://en.wikipedia.org/wiki/Paeonia_lactiflora', priceBasis: 'NL-auction', note: 'Named-variety price (Coral Sunset, 2022) preferred over whole-market average.' },
  'dalia':               { price: 'https://www.bloomsbythebox.com/wholesale-dahlias-flowers/assorted-dahlias-10-bunch-10-stem-box_7696/', botany: 'https://www.dahlia.org/growing/the-dahlia-as-a-cut-flower-2/', priceBasis: 'US-wholesaler' },
  'rosa-inglesa':        { price: 'https://fiftyflowers.com/products/assorted-david-austin-garden-roses', botany: 'https://www.gardenia.net/guide/david-austin-roses-bringing-english-garden-charm-to-your-home', priceBasis: 'US-wholesaler', note: 'Latin binomial is the historic Provence rose, not modern David Austin hybrids; kept per catalog convention.' },
  'gerbera':             { price: 'https://www.bloomsbythebox.com/gerbera-daisy-flowers/', botany: 'https://www.rhs.org.uk/plants/gerbera/growing-guide', priceBasis: 'US-wholesaler' },
  'girasol':             { price: 'https://fiftyflowers.com/collections/sunflowers', botany: 'https://www.harrisseeds.com/blogs/from-the-ground-up/complete-sunflower-sales-guide', priceBasis: 'US-wholesaler', note: 'Season uses field bloom window, not import-extended marketing claim.' },
  'lirio-oriental':      { price: 'https://fiftyflowers.com/products/white-oriental-lilies', botany: 'https://www.dutchbulbs.com/products/_casa_blanca_oriental_lily', priceBasis: 'US-wholesaler' },
  'amarilis':            { price: 'https://fiftyflowers.com/products/amaryllis-red-bulk-flower', botany: 'https://plantura.garden/uk/flowers-perennials/amaryllis/amaryllis-cut-flowers', priceBasis: 'US-wholesaler', note: 'Price gap closed after initial research pass; entry-tier (15-stem) price used.' },
  'protea':              { price: 'https://fiftyflowers.com/products/king-protea-flower', botany: 'https://fiftyflowers.com/products/king-protea-flower', priceBasis: 'US-wholesaler', note: 'Two supplier prices found (€15.63 vs €34.50/stem), not reconciled; midpoint used.' },
  'orquidea-cymbidium':  { price: 'https://metroflowermarket.com/products/orchid-cymbidium-red-stem', botany: 'https://www.aos.org/orchid-care/care-sheets/cymbidium-culture-sheet', priceBasis: 'US-wholesaler' },
  'ranunculo':           { price: 'https://www.bloomsbythebox.com/ranunculus-flowers/ranunculus-pink_1933/', botany: 'https://floristsreview.com/in-season-ranunculus/', priceBasis: 'US-wholesaler' },
  'tulipan':             { price: 'https://www.bloomsbythebox.com/tulip-flowers/tulip-red_7916/', botany: 'https://www.gardenia.net/guide/how-long-do-tulips-last', priceBasis: 'US-wholesaler' },
  'anemona':             { price: 'https://www.bloomsbythebox.com/anemone-flowers/anemone-white-green-eye_7925/', botany: 'https://www.gardenia.net/genus/anemone-coronaria-poppy-anemone', priceBasis: 'US-wholesaler' },
  'alstroemeria':        { price: 'https://www.bloomsbythebox.com/alstroemeria-flowers/alstroemeria-red_353/', botany: 'https://www.trianglenursery.co.uk/flower-guides/alstromaria-guide', priceBasis: 'US-wholesaler' },
  'clavel':              { price: 'https://www.bloomsbythebox.com/carnation-flowers/carnations-green-fancy_1850/', botany: 'https://pfaf.org/user/Plant.aspx?LatinName=Dianthus+caryophyllus', priceBasis: 'US-wholesaler' },
  'fresia':              { price: 'https://www.bloomsbythebox.com/freesia-flowers/freesia-white_35/', botany: 'https://avanote.net/when-is-freesia-in-season/', priceBasis: 'US-wholesaler' },
  'lisianthus':          { price: 'https://www.bloomsbythebox.com/lisianthus-flowers/lisianthus-white_61/', botany: 'https://www.calyxflowers.com/floral-library/lisianthus/', priceBasis: 'US-wholesaler' },
  'iris-holandes':       { price: 'https://www.bloomsbythebox.com/wholesale-iris-flowers/', botany: 'https://www.longfield-gardens.com/blogs/all-about-fall-planted-bulbs/all-about-dutch-iris', priceBasis: 'estimate', note: 'Price and headMm are compiler estimates — source bunch stem-count and bloom diameter not confirmed.' },
  'zinnia':              { price: 'https://shiftingroots.com/practical-guide-for-pricing-bouquets/', botany: 'https://extension.msstate.edu/publications/zinnias-zinnia-elegans-for-the-farmer-florist', priceBasis: 'US-wholesaler', note: 'Weakest-sourced price in the catalog — farm-direct listings, not a canonical wholesale citation.' },
  'flor-de-cera':        { price: 'https://www.bloomsbythebox.com/filler-flowers/wax-flower-white_102/', botany: 'https://www.flowershopnetwork.com/blog/flower-dictionary/waxflower/', priceBasis: 'US-wholesaler' },
  'paniculata':          { price: 'https://www.bloomsbythebox.com/filler-flowers/gypsophila-xlence_7926/', botany: 'https://postharvest.ucdavis.edu/produce-facts-sheets/babys-breath-gypsophilia', priceBasis: 'US-wholesaler' },
  'aciano':              { price: 'https://www.bloomsbythebox.com/assorted-flowers/cornflower-assorted-bulk_9343/', botany: 'https://www.gardenia.net/plant/centaurea-cyanus-cornflower', priceBasis: 'US-wholesaler', note: 'Two supplier prices found (€1.66 vs €3.46/stem), not reconciled; midpoint used.' },
  'limonium':            { price: 'https://www.bloomsbythebox.com/filler-flowers/limonium-misty-blue_1365/', botany: 'https://plants.ces.ncsu.edu/plants/limonium-sinuatum/', priceBasis: 'US-wholesaler', note: 'headMm is cluster-spread estimate, not individual floret size (florets are only a few mm).' },
  'solidago':            { price: 'https://www.bloomsbythebox.com/filler-flowers/solidago_7622/', botany: 'https://floralife.com/flowers/solidago/', priceBasis: 'US-wholesaler', note: 'headMm is plume-length estimate, not individual floret size.' },
  'craspedia':           { price: 'https://www.bloomsbythebox.com/novelty-flowers/craspedi_16/', botany: 'https://florabundance.com/flowers/craspedia/', priceBasis: 'US-wholesaler' },
  'astilbe':             { price: 'https://www.bloomsbythebox.com/novelty-flowers/astilbe-pink_2/', botany: 'https://www.floraldesigninstitute.com/blogs/resources-flower-library/astilbe', priceBasis: 'US-wholesaler', note: 'headMm is plume-length estimate, not individual floret size.' },
  'ammi-majus':          { price: 'https://fiftyflowers.com/products/queen-annes-lace-filler-flower', botany: 'https://plants.ces.ncsu.edu/plants/ammi-majus/', priceBasis: 'US-wholesaler' },
  'genista':             { price: 'https://fiftyflowers.com/products/white-scotchbroom-flower', botany: 'https://www.calyxflowers.com/floral-library/broom/', priceBasis: 'US-wholesaler', note: 'Price gap closed after initial research pass. headMm is a compiler estimate (spray spread), no source found.' },
  'eucalipto':           { price: 'https://www.bloomsbythebox.com/greenery/eucalyptus-silver-dollar_110/', botany: 'https://www.rhs.org.uk/plants/19957/eucalyptus-cinerea/details', priceBasis: 'US-wholesaler', note: 'headMm (frond spread) is a compiler estimate, no published spread metric exists for foliage.' },
  'rusco':               { price: 'https://flowerwholesale.com/israeli-ruscus-60cm/', botany: 'https://www.steengreens.com/blog/ruscus-hypophyllum', priceBasis: 'US-wholesaler', note: 'headMm estimate. Price is for Israeli R. hypophyllum specifically (matches binomial); Italian R. aculeatus runs far higher and is a different product.' },
  'cola-de-conejo':      { price: 'no confident fresh-stem wholesale source found despite two research passes', botany: 'https://www.epicgardening.com/bunny-tails-grass/', priceBasis: 'estimate', note: 'Price and headMm are unsourced estimates carried forward — only dried-product prices exist publicly for this species.' },
  'helecho-cuero':       { price: 'https://www.bloomsbythebox.com/greenery/leather-leaf-fern_1070/', botany: 'https://www.floraldesigninstitute.com/blogs/resources-flower-library/leather-leaf-fern', priceBasis: 'US-wholesaler', note: 'headMm estimate.' },
  'salal':               { price: 'https://www.bloomsbythebox.com/greenery/lemon-leaf_990/', botany: 'https://www.floraldesigninstitute.com/blogs/resources-flower-library/salal-foliage', priceBasis: 'US-wholesaler', note: 'headMm estimate. Season uses PNW wild-harvest window (excludes Jun-Aug) rather than commercial year-round claim.' },
  'pitosporo':           { price: 'https://www.bloomsbythebox.com/greenery/pittosporum_7649/', botany: 'https://www.rhs.org.uk/plants/pittosporum/growing-guide', priceBasis: 'US-wholesaler', note: 'headMm estimate. lengthCm uses the longer (spray) supplier figure; a shorter 18-23cm figure also exists.' },
  'aspidistra':          { price: 'https://fiftyflowers.com/products/aspidistra-leaf-greenery', botany: 'https://www.rhs.org.uk/plants/1715/aspidistra-elatior/details', priceBasis: 'US-wholesaler', note: 'Entry-tier price used; bulk tier runs ~4x lower.' },
  'esparrago-plumoso':   { price: 'https://www.bloomsbythebox.com/greenery/plumosus-fern_7650/', botany: 'https://florabundance.com/flowers/plumosa/', priceBasis: 'US-wholesaler', note: 'Price gap closed after initial research pass. Shape mapped to spray over spike (branching fronds, not a single vertical plume) — editorial call, flagged for design review.' },
}

const NEUTRAL_CHROMA = 0.02

function parseOklch(color: string): { l: number; c: number; h: number } {
  const match = color.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
  if (!match) throw new Error(`Invalid oklch color: ${color}`)
  return { l: Number(match[1]), c: Number(match[2]), h: Number(match[3]) }
}

/** Buckets a species into a coarse color family for filtering. Foliage (`green` role) always
 *  buckets as `verde` regardless of its exact hue — florists group all greenery together. */
export function colorFamily(species: Pick<Species, 'role' | 'color'>): ColorFamily {
  if (species.role === 'green') return 'verde'

  const { c, h } = parseOklch(species.color)
  if (c < NEUTRAL_CHROMA) return 'blanco'
  if (h >= 330 || h < 15) return 'rosa'
  if (h < 30) return 'rojo'
  if (h < 45) return 'naranja'
  if (h < 100) return 'amarillo'
  if (h < 220) return 'verde'
  if (h < 280) return 'azul'
  return 'morado'
}

export interface SpeciesFilter {
  colorFamilies?: ColorFamily[]
  seasonOnly?: boolean
  month?: number
}

/** Pure filter over a species list. `seasonOnly` restricts to species available in `month`
 *  (1-12, defaults to the current month). Empty `colorFamilies` means no color restriction. */
export function filterSpecies(list: Species[], filter: SpeciesFilter): Species[] {
  const month = filter.month ?? new Date().getMonth() + 1
  return list.filter((s) => {
    if (filter.colorFamilies && filter.colorFamilies.length > 0 && !filter.colorFamilies.includes(colorFamily(s))) {
      return false
    }
    if (filter.seasonOnly && !s.season.includes(month)) {
      return false
    }
    return true
  })
}
