import { describe, it, expect } from 'vitest'
import { oklchToHex, contrastRatio } from './color'
import { SPECIES } from './species'

describe('oklchToHex', () => {
  it('converts pure white', () => {
    expect(oklchToHex('oklch(1 0 0)')).toBe('#ffffff')
  })

  it('converts pure black', () => {
    expect(oklchToHex('oklch(0 0 0)')).toBe('#000000')
  })

  it('returns black for anything that is not an oklch() string', () => {
    expect(oklchToHex('#3F5D3A')).toBe('#000000')
    expect(oklchToHex('rebeccapurple')).toBe('#000000')
    expect(oklchToHex('')).toBe('#000000')
  })

  it("converts peonía's catalog color to a real, non-black hex", () => {
    // This is the actual regression the bug produced: sharp/librsvg renders `oklch()` as
    // black, so a non-black assertion is the meaningful check here.
    const peonia = SPECIES.find((s) => s.id === 'peonia')!
    const hex = oklchToHex(peonia.color)
    expect(hex).toMatch(/^#[0-9a-f]{6}$/)
    expect(hex).not.toBe('#000000')
  })

  it('converts every species color to a valid, non-black hex', () => {
    for (const species of SPECIES) {
      const hex = oklchToHex(species.color)
      expect(hex, `${species.id} (${species.color})`).toMatch(/^#[0-9a-f]{6}$/)
      expect(hex, `${species.id} (${species.color})`).not.toBe('#000000')
    }
  })

  it("matches --color-accent's own documented hex (tokens/theme.css)", () => {
    // tokens/theme.css: `--color-accent: oklch(0.4449 0.0664 141); /* #3F5D3A */` — an
    // independently-authored round-trip that pins the conversion to a known-good value.
    expect(oklchToHex('oklch(0.4449 0.0664 141)')).toBe('#3f5d3a')
  })
})

describe('contrastRatio', () => {
  it('gives the maximum ratio (21) for black vs white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('gives a ratio of 1 for identical colors', () => {
    expect(contrastRatio('#6b6f66', '#6b6f66')).toBeCloseTo(1, 5)
  })

  it('is order-independent', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#000000'), 5)
  })

  it("confirms the OLD --color-muted failed WCAG AA against --color-canvas (the bug Task 5 fixes)", () => {
    // tokens/theme.css BEFORE this task: --color-muted: oklch(0.5355 0.0143 125) => #6b6f66
    // tokens/theme.css: --color-canvas: oklch(0.9422 0.0081 97) => #edece6
    const oldMuted = oklchToHex('oklch(0.5355 0.0143 125)')
    expect(contrastRatio(oldMuted, '#edece6')).toBeLessThan(4.5)
  })

  it('confirms the NEW --color-muted passes WCAG AA (4.5:1) against both canvas and surface', () => {
    // tokens/theme.css AFTER this task: --color-muted: oklch(0.50 0.0143 125) => #61655c
    const newMuted = oklchToHex('oklch(0.50 0.0143 125)')
    expect(contrastRatio(newMuted, '#edece6')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(newMuted, '#ffffff')).toBeGreaterThanOrEqual(4.5)
  })
})
