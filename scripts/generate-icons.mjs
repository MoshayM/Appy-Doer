/**
 * Regenerates all PWA / browser / installed-app icons from icon.svg
 * using sharp (already a Next.js dependency).
 *
 * Usage: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir  = dirname(fileURLToPath(import.meta.url))
const root   = join(__dir, '..')
const svgSrc = join(root, 'public', 'icons', 'icon.svg')
const svg    = readFileSync(svgSrc)

mkdirSync(join(root, 'public', 'icons'), { recursive: true })

const ICONS = [
  // PWA manifest icons
  { out: 'public/icons/icon-72.png',   size: 72  },
  { out: 'public/icons/icon-96.png',   size: 96  },
  { out: 'public/icons/icon-128.png',  size: 128 },
  { out: 'public/icons/icon-144.png',  size: 144 },
  { out: 'public/icons/icon-152.png',  size: 152 },
  { out: 'public/icons/icon-192.png',  size: 192 },
  { out: 'public/icons/icon-384.png',  size: 384 },
  { out: 'public/icons/icon-512.png',  size: 512 },
  // Browser / OS specific
  { out: 'public/favicon-32.png',      size: 32  },   // classic browsers
  { out: 'public/apple-touch-icon.png',size: 180 },   // iOS home screen
]

let ok = 0
for (const { out, size } of ICONS) {
  const dest = join(root, out)
  await sharp(svg, { density: Math.ceil(size * 2.5) })   // high density for crisp PNGs
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(dest)
  console.log(`✓  ${size}×${size}  →  ${out}`)
  ok++
}

console.log(`\nDone — ${ok} icons generated from icon.svg`)
