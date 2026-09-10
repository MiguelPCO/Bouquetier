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
  // `searchParams.get()` returns only the first value, so a duplicated `?s=a&s=b` is
  // already safe here (unlike a page's `searchParams`, which can hand over an array).
  const { searchParams } = new URL(request.url)

  try {
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
  } catch (error) {
    // This route takes untrusted input (`?s=`) and rasterizes it through a native library.
    // Without this, any throw returns Next's HTML error page under a `Content-Type:
    // image/png` header — a broken image everywhere it's unfurled. Degrade to the static
    // fallback instead, which is a valid 1200x630 PNG.
    console.error('Failed to render OG image:', error)
    return Response.redirect(new URL('/og-fallback.png', request.url))
  }
}
