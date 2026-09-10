// app/api/og/route.ts
import sharp from 'sharp'
import { decodeShareLink } from '@/lib/shareLink'
import { BouquetSvg } from '@/components/BouquetSvg'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Dynamic import (not a static `import ... from 'react-dom/server'`): a static
  // import of react-dom/server anywhere under app/ — including this Route Handler,
  // verified under both Turbopack and webpack dev — trips Next's react-server
  // build guard ("You're importing a component that imports react-dom/server").
  // The dynamic import resolves the module at request time, after that static
  // analysis pass, and works under `runtime = 'nodejs'`.
  const { renderToStaticMarkup } = await import('react-dom/server')
  const { searchParams } = new URL(request.url)
  const stems = decodeShareLink(searchParams.get('s'))

  const svg = renderToStaticMarkup(BouquetSvg({ stems, background: '#EDECE6' }))
  const svgDocument = `<?xml version="1.0" encoding="UTF-8"?>${svg}`

  const png = await sharp(Buffer.from(svgDocument), { density: 220 })
    .resize(1200, 630, { fit: 'contain', background: '#EDECE6' })
    .png()
    .toBuffer()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=604800, immutable',
    },
  })
}
