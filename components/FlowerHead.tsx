// components/FlowerHead.tsx
import { noise } from '@/lib/vogel'
import { oklchToHex } from '@/lib/color'
import type { Shape } from '@/lib/species'

interface FlowerHeadProps {
  shape: Shape
  size: number
  color: string
  uid: number
  /** Distinguishes this SVG's gradient/pattern ids from another BouquetSvg mounted
   *  elsewhere in the same document (e.g. the mobile and desktop bouquet canvases render
   *  simultaneously with `md:hidden`/`hidden md:block` — both draw the same stem uids, and
   *  without this prefix their gradient ids collide. Per SVG's `url(#id)` resolution, a
   *  duplicate id anywhere in the document — even inside a `display:none` subtree — can win
   *  the reference, silently making every petal fill resolve to nothing. */
  instanceId?: string
}

function petal(length: number, width: number): string {
  const hw = width / 2
  return `M0,0 C${-hw},${-length * 0.32} ${-hw * 0.75},${-length * 0.82} 0,${-length} C${hw * 0.75},${-length * 0.82} ${hw},${-length * 0.32} 0,0 Z`
}

function Gradient({ id, color }: { id: string; color: string }) {
  return (
    <radialGradient id={id} cx="36%" cy="30%" r="75%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
      <stop offset="48%" stopColor={color} />
      <stop offset="100%" stopColor={color} stopOpacity="0.82" />
    </radialGradient>
  )
}

function PetalRings({
  id,
  uid,
  rings,
}: {
  id: string
  uid: number
  rings: { count: number; length: number; width: number; radius: number; rotationOffset: number; opacity: number }[]
}) {
  return (
    <>
      {rings.map((ring, ringIdx) =>
        Array.from({ length: ring.count }, (_, i) => {
          const baseAngle = (i / ring.count) * 360 + ring.rotationOffset
          const jitterAngle = (noise(uid + ringIdx * 13 + i) - 0.5) * 14
          const jitterScale = 0.9 + noise(uid + ringIdx * 7 + i * 3) * 0.2
          return (
            <g key={`${ringIdx}-${i}`} transform={`rotate(${baseAngle + jitterAngle}) translate(0 ${-ring.radius}) scale(${jitterScale})`}>
              <path d={petal(ring.length, ring.width)} fill={`url(#${id})`} opacity={ring.opacity} />
            </g>
          )
        })
      )}
    </>
  )
}

export function FlowerHead({ shape, size: s, color, uid, instanceId }: FlowerHeadProps) {
  const gradId = `fh-${instanceId ?? 'x'}-${shape}-${uid}`
  // Species colors are `oklch()` strings. Browsers parse those, but `sharp`/librsvg (the
  // server-side rasterizer behind app/api/og/route.ts) does not — it silently paints them
  // black. Convert once here so every fill/stop-color below is a plain hex that renders
  // identically in the browser and in a standalone rasterized SVG.
  const hex = oklchToHex(color)

  switch (shape) {
    case 'peony':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={hex} />
          </defs>
          <PetalRings
            id={gradId}
            uid={uid}
            rings={[
              { count: 11, length: s * 0.5, width: s * 0.32, radius: s * 0.24, rotationOffset: 0, opacity: 0.9 },
              { count: 9, length: s * 0.4, width: s * 0.26, radius: s * 0.15, rotationOffset: 18, opacity: 0.94 },
              { count: 7, length: s * 0.3, width: s * 0.2, radius: s * 0.07, rotationOffset: 36, opacity: 1 },
            ]}
          />
          <circle r={s * 0.08} fill={hex} opacity="0.55" />
          <circle r={s * 0.04} fill="#1c1f1a" opacity="0.3" />
        </g>
      )

    case 'dahlia':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={hex} />
          </defs>
          <PetalRings
            id={gradId}
            uid={uid}
            rings={[
              { count: 14, length: s * 0.52, width: s * 0.14, radius: s * 0.2, rotationOffset: 0, opacity: 0.92 },
              { count: 10, length: s * 0.36, width: s * 0.12, radius: s * 0.1, rotationOffset: 12, opacity: 0.97 },
            ]}
          />
          <circle r={s * 0.09} fill="#fbf3e4" />
        </g>
      )

    case 'ranun':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={hex} />
          </defs>
          <PetalRings
            id={gradId}
            uid={uid}
            rings={[
              { count: 8, length: s * 0.42, width: s * 0.3, radius: s * 0.18, rotationOffset: 0, opacity: 0.85 },
              { count: 8, length: s * 0.3, width: s * 0.24, radius: s * 0.09, rotationOffset: 22, opacity: 0.95 },
            ]}
          />
          <circle r={s * 0.07} fill="#1c1f1a" opacity="0.28" />
        </g>
      )

    case 'tulip':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={hex} />
          </defs>
          <path
            d={`M ${-s * 0.34} ${s * 0.1} C ${-s * 0.38} ${-s * 0.5} ${-s * 0.12} ${-s * 0.6} 0 ${-s * 0.6} C ${s * 0.12} ${-s * 0.6} ${s * 0.38} ${-s * 0.5} ${s * 0.34} ${s * 0.1} C ${s * 0.2} ${s * 0.44} ${-s * 0.2} ${s * 0.44} ${-s * 0.34} ${s * 0.1} Z`}
            fill={`url(#${gradId})`}
          />
          <path
            d={`M 0 ${s * 0.08} L 0 ${-s * 0.52}`}
            stroke="#ffffff"
            strokeOpacity="0.3"
            strokeWidth={s * 0.03}
            strokeLinecap="round"
          />
        </g>
      )

    case 'umbel':
      return (
        <g>
          <defs>
            <Gradient id={gradId} color={hex} />
          </defs>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 + noise(uid + i) * 1.4
            const d = s * (0.16 + noise(uid + i * 3) * 0.34)
            const r = s * (0.09 + noise(uid + i * 5) * 0.04)
            return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r} fill={`url(#${gradId})`} />
          })}
        </g>
      )

    case 'spray':
      return (
        <g opacity="0.95">
          <defs>
            <Gradient id={gradId} color={hex} />
          </defs>
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2 + noise(uid + i * 7) * 2
            const d = s * (0.12 + noise(uid + i) * 0.48)
            const r = s * 0.06
            return <circle key={i} cx={Math.cos(a) * d} cy={Math.sin(a) * d} r={r} fill={`url(#${gradId})`} />
          })}
        </g>
      )

    case 'leaf':
      return (
        <g transform={`rotate(${noise(uid) * 60 - 30})`}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={hex} stopOpacity="0.7" />
              <stop offset="100%" stopColor={hex} />
            </linearGradient>
          </defs>
          <path
            d={`M 0 ${-s * 0.6} C ${s * 0.36} ${-s * 0.24} ${s * 0.36} ${s * 0.3} 0 ${s * 0.6} C ${-s * 0.36} ${s * 0.3} ${-s * 0.36} ${-s * 0.24} 0 ${-s * 0.6} Z`}
            fill={`url(#${gradId})`}
          />
          <line x1="0" y1={-s * 0.5} x2="0" y2={s * 0.5} stroke="#1c1f1a" strokeWidth="0.6" opacity="0.2" />
        </g>
      )

    case 'spike':
      return (
        <g transform={`rotate(${noise(uid) * 24 - 12})`}>
          <defs>
            <Gradient id={gradId} color={hex} />
          </defs>
          {Array.from({ length: 7 }, (_, i) => {
            const t = i / 6
            const yOff = (t - 0.5) * s * 0.72
            const wisp = s * (0.16 - Math.abs(t - 0.5) * 0.1)
            return <ellipse key={i} cy={yOff} rx={wisp} ry={s * 0.22} fill={`url(#${gradId})`} opacity={0.85} />
          })}
        </g>
      )

    default:
      return <circle r={s * 0.4} fill={hex} />
  }
}
