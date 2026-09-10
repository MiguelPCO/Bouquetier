// lib/exportPng.ts
'use client'

import { renderToStaticMarkup } from 'react-dom/server'
import { BouquetSvg } from '@/components/BouquetSvg'
import type { Stem } from './species'

const EXPORT_WIDTH = 900
const EXPORT_HEIGHT = 1012 // mantiene la proporción 400:450 del viewBox de BouquetSvg

export async function downloadBouquetPng(stems: Stem[]): Promise<void> {
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
  URL.revokeObjectURL(url)
}
