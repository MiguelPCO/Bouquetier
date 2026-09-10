import { describe, it, expect } from 'vitest'
import { oklchToHex } from './color'
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
