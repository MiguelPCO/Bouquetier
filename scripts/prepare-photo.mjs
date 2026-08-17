#!/usr/bin/env node
import sharp from 'sharp'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const speciesId = process.argv[2]
if (!speciesId) {
  console.error('Usage: node scripts/prepare-photo.mjs <species-id>')
  process.exit(1)
}

const inputPath = path.join(root, 'assets', 'photos-raw', `${speciesId}.png`)
const outputDir = path.join(root, 'public', 'photos')
const outputPath = path.join(outputDir, `${speciesId}.png`)

const meta = await sharp(inputPath).metadata()
if (!meta.hasAlpha) {
  console.error(
    `Error: ${inputPath} has no alpha channel — expected a transparent-background PNG ` +
    `per docs/photo-pipeline.md's delivery convention. An opaque background would pass ` +
    `through untrimmed and unflagged.`
  )
  process.exit(1)
}

await mkdir(outputDir, { recursive: true })
const info = await sharp(inputPath)
  .trim()
  .resize(480, 480, {
    fit: 'contain',
    position: 'bottom',
    withoutEnlargement: true,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toFile(outputPath)

if (info.width < 480 || info.height < 480) {
  console.warn(
    `Warning: trimmed source was smaller than 480x480 — kept at native resolution ` +
    `(padded, not upscaled) to avoid blur.`
  )
}

console.log(`Wrote ${outputPath} (${info.width}x${info.height})`)
