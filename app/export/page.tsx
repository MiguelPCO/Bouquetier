// app/export/page.tsx
import { ExportView } from '@/components/ExportView'

export default function ExportPage() {
  const monthLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <main className="min-h-screen bg-canvas text-ink px-6 py-10 md:px-10 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Salida de impresión</h1>
        <p className="text-[11px] text-muted font-mono uppercase tracking-[0.1em] mt-1">
          Temporada evaluada: {monthLabel}
        </p>
      </div>
      <ExportView />
    </main>
  )
}
