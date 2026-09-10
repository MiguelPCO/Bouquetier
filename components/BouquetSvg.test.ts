import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { BouquetSvg } from './BouquetSvg'
import { SPECIES } from '@/lib/species'

const peonia = SPECIES.find((s) => s.id === 'peonia')!
const dalia = SPECIES.find((s) => s.id === 'dalia')!

describe('BouquetSvg', () => {
  it('renders a self-contained <svg> with the expected viewBox', () => {
    const markup = renderToStaticMarkup(
      BouquetSvg({ stems: [{ uid: 1, species: peonia }] })
    )
    expect(markup).toMatch(/^<svg /)
    expect(markup).toContain('viewBox="-200 -310 400 450"')
  })

  it('renders one <g> group per stem', () => {
    const markup = renderToStaticMarkup(
      BouquetSvg({ stems: [{ uid: 1, species: peonia }, { uid: 2, species: dalia }] })
    )
    const stemGroups = markup.match(/<g style="opacity:/g) ?? []
    expect(stemGroups).toHaveLength(2)
  })

  it('renders no background rect when background is omitted', () => {
    const markup = renderToStaticMarkup(BouquetSvg({ stems: [{ uid: 1, species: peonia }] }))
    expect(markup).not.toContain('<rect')
  })

  it('renders a background rect filling the viewBox when background is provided', () => {
    const markup = renderToStaticMarkup(
      BouquetSvg({ stems: [{ uid: 1, species: peonia }], background: '#EDECE6' })
    )
    expect(markup).toContain('<rect x="-200" y="-310" width="400" height="450" fill="#EDECE6"')
  })

  it('renders nothing extra for an empty bouquet (no placeholder text baked into the export)', () => {
    const markup = renderToStaticMarkup(BouquetSvg({ stems: [] }))
    expect(markup).not.toContain('Añade una flor focal')
  })
})
