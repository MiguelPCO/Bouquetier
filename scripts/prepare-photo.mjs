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

const { data, info } = await sharp(inputPath).trim().png().toBuffer({ resolveWithObject: true })

await mkdir(outputDir, { recursive: true })
await sharp(data)
  .resize(480, 480, { fit: 'contain', position: 'bottom', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(outputPath)

console.log(`Wrote ${outputPath} (trimmed source was ${info.width}x${info.height}, output is 480x480)`)
