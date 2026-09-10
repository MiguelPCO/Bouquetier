// app/page.tsx
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { SpeciesCatalog } from '@/components/SpeciesCatalog'
import { ShareLinkSync } from '@/components/ShareLinkSync'
import { ExportPngButton } from '@/components/ExportPngButton'
import { CopyShareLinkButton } from '@/components/CopyShareLinkButton'
import { decodeShareLink, describeShareBouquet } from '@/lib/shareLink'

export async function generateMetadata({
  searchParams,
}: {
  // Next's runtime type for a search param is `string | string[]`: a duplicated param
  // (`?s=a&s=b`) arrives as an array. Typing it as a bare `string` compiled fine but made
  // `decodeShareLink` call `.split(',')` on an array, throwing a 500 out of
  // `generateMetadata` — i.e. any visitor could crash `/` with a hostile URL.
  searchParams: Promise<{ s?: string | string[] }>
}): Promise<Metadata> {
  const { s: sRaw } = await searchParams
  const s = Array.isArray(sRaw) ? sRaw[0] : sRaw
  const stems = decodeShareLink(s)
  const { title, description } = describeShareBouquet(stems)

  // Explicit width/height: some platforms only render a large card if the dimensions are
  // known on the first fetch, before they've downloaded the image itself.
  const images =
    stems.length > 0
      ? [{ url: `/api/og?s=${encodeURIComponent(s ?? '')}`, width: 1200, height: 630 }]
      : [{ url: '/og-fallback.png', width: 1200, height: 630 }]

  return {
    title,
    description,
    openGraph: { title, description, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
  }
}

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10">
      <Suspense fallback={null}>
        <ShareLinkSync />
      </Suspense>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Monta tu ramo</h1>
        <div className="flex items-center gap-3">
          <CopyShareLinkButton />
          <ExportPngButton />
          <Link href="/export" className="text-accent underline text-[13px]">
            Exportar →
          </Link>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <SpeciesCatalog />
        <div className="bg-surface border border-line rounded-xl p-4">
          <BouquetCanvas />
        </div>
      </div>
    </main>
  )
}
