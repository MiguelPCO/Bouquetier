import { describe, it, expect } from 'vitest'
import { resolveActiveCategory, type PanelVisibility } from './categorySwipe'

describe('resolveActiveCategory', () => {
  it('picks the panel with the highest intersection ratio', () => {
    const panels: PanelVisibility[] = [
      { role: 'focal', intersectionRatio: 0.1 },
      { role: 'secondary', intersectionRatio: 0.9 },
      { role: 'filler', intersectionRatio: 0 },
      { role: 'green', intersectionRatio: 0 },
    ]
    expect(resolveActiveCategory(panels, 'focal')).toBe('secondary')
  })

  it('keeps the previous active category when every panel reports zero ratio', () => {
    const panels: PanelVisibility[] = [
      { role: 'focal', intersectionRatio: 0 },
      { role: 'secondary', intersectionRatio: 0 },
      { role: 'filler', intersectionRatio: 0 },
      { role: 'green', intersectionRatio: 0 },
    ]
    expect(resolveActiveCategory(panels, 'secondary')).toBe('secondary')
  })

  it('breaks a tie in favor of the previous active category when it is among the tied panels', () => {
    const panels: PanelVisibility[] = [
      { role: 'focal', intersectionRatio: 0.5 },
      { role: 'secondary', intersectionRatio: 0.5 },
      { role: 'filler', intersectionRatio: 0 },
      { role: 'green', intersectionRatio: 0 },
    ]
    expect(resolveActiveCategory(panels, 'secondary')).toBe('secondary')
  })

  it('breaks a tie by taking the first tied panel when the previous active category is not among them', () => {
    const panels: PanelVisibility[] = [
      { role: 'focal', intersectionRatio: 0.5 },
      { role: 'secondary', intersectionRatio: 0.5 },
      { role: 'filler', intersectionRatio: 0 },
      { role: 'green', intersectionRatio: 0 },
    ]
    expect(resolveActiveCategory(panels, 'filler')).toBe('focal')
  })
})
