// app/page.tsx
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { SpeciesCatalog } from '@/components/SpeciesCatalog'
import { ShareLinkSync } from '@/components/ShareLinkSync'
import { decodeShareLink, describeShareBouquet } from '@/lib/shareLink'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>
}): Promise<Metadata> {
  const { s } = await searchParams
  const stems = decodeShareLink(s)
  const { title, description } = describeShareBouquet(stems)

  const images = stems.length > 0 ? [`/api/og?s=${encodeURIComponent(s ?? '')}`] : ['/og-fallback.png']

  return {
    title,
    description,
    openGraph: { title, description, images },
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
        <Link href="/export" className="text-accent underline text-[13px]">
          Exportar →
        </Link>
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
