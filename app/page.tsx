// app/page.tsx
import Link from 'next/link'
import { BouquetCanvas } from '@/components/BouquetCanvas'
import { SpeciesCatalog } from '@/components/SpeciesCatalog'

export default function Home() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10">
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
