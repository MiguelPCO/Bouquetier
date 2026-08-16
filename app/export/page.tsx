// app/export/page.tsx
import { ExportView } from '@/components/ExportView'

export default function ExportPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-6 no-print">Salida de impresión</h1>
      <ExportView />
    </main>
  )
}
