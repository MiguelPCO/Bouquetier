// lib/exportPng.ts
'use client'

import { BouquetSvg, BOUQUET_VIEWBOX } from '@/components/BouquetSvg'
import type { Stem } from './species'

const EXPORT_WIDTH = 900
/** Derived from BouquetSvg's own viewBox so the export can never drift from the drawing. */
const EXPORT_HEIGHT = Math.round(EXPORT_WIDTH * (BOUQUET_VIEWBOX.height / BOUQUET_VIEWBOX.width))

export async function downloadBouquetPng(stems: Stem[]): Promise<void> {
  // Dynamic import so react-dom/server's browser build is code-split out of the initial
  // bundle for `/`: this module is pulled in statically by ExportPngButton, so a top-level
  // import shipped the whole renderer to every visitor whether or not they ever export.
  const { renderToStaticMarkup } = await import('react-dom/server')
  const svgMarkup = renderToStaticMarkup(BouquetSvg({ stems }))
  const svgWithSize = svgMarkup.replace('<svg ', `<svg width="${EXPORT_WIDTH}" height="${EXPORT_HEIGHT}" `)

  const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgWithSize)}`

  const image = new Image()
  image.src = svgDataUrl
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('No se pudo generar la imagen del ramo.'))
  })

  const canvas = document.createElement('canvas')
  canvas.width = EXPORT_WIDTH
  canvas.height = EXPORT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo generar la imagen del ramo.')
  ctx.drawImage(image, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('No se pudo generar la imagen del ramo.')

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'bouquetier-ramo.png'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  // Deferred, not synchronous: revoking in the same tick as click() has historically
  // cancelled the download in some browsers, which start reading the blob asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
