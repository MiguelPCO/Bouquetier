// lib/color.ts

/**
 * Converts a CSS `oklch(L C H)` string to a `#rrggbb` hex string.
 *
 * Needed because every species color in `lib/species.ts` is an `oklch()` string, and the
 * server-side rasterizer (`sharp`, via librsvg) does not understand CSS Color Level 4
 * `oklch()` — it silently renders it as black. Browsers parse it fine, so this only ever
 * showed up in server-rendered output (`app/api/og/route.ts`).
 *
 * Implements the standard OKLab -> linear sRGB -> gamma-encoded sRGB conversion (CSS Color
 * Module Level 4 / Björn Ottosson's OKLab matrices). Out-of-gamut components are clamped
 * per channel, which is what browsers do for in-gamut-ish colors too — every species color
 * in this catalog is inside sRGB, so the clamp is a safety net, not the normal path.
 *
 * Returns `#000000` for anything that doesn't parse as `oklch(L C H)`.
 */
export function oklchToHex(oklch: string): string {
  const match = oklch.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/)
  if (!match) return '#000000'
  const [, lStr, cStr, hStr] = match
  const L = Number(lStr)
  const C = Number(cStr)
  const H = (Number(hStr) * Math.PI) / 180

  const a = C * Math.cos(H)
  const b = C * Math.sin(H)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

  const toSrgb = (c: number) => {
    const clamped = Math.min(1, Math.max(0, c))
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
  }
  const toByte = (c: number) => Math.round(toSrgb(c) * 255)
  const hex = (n: number) => n.toString(16).padStart(2, '0')

  return `#${hex(toByte(rLin))}${hex(toByte(gLin))}${hex(toByte(bLin))}`
}
