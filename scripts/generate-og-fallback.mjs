import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'public', 'og-fallback.png')

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#EDECE6" />
  <text x="600" y="330" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-style="italic" fill="#1C1F1A">Bouquetier</text>
  <text x="600" y="390" text-anchor="middle" font-family="Courier New, monospace" font-size="22" letter-spacing="3" fill="#6B6F66">ARMA TU RAMO</text>
</svg>
`

async function main() {
  await mkdir(dirname(outPath), { recursive: true })
  const png = await sharp(Buffer.from(svg)).png().toBuffer()
  await writeFile(outPath, png)
  console.log(`Wrote ${outPath}`)
}

main()
