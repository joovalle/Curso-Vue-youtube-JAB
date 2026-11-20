/**
 * Genera los íconos PNG (PWA, Android, iOS) a partir de public/favicon.svg
 * usando Chromium (Playwright). Uso: node scripts/build-icons.mjs
 */
import { readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

// Playwright puede estar instalado globalmente; require() respeta NODE_PATH.
const { chromium } = createRequire(import.meta.url)('playwright')

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = await readFile(join(root, 'public/favicon.svg'), 'utf8')
const browser = await chromium.launch()
const page = await browser.newPage()

async function render(file, size, { maskable = false, bg = 'transparent' } = {}) {
  // Maskable: el logo ocupa el 70 % central sobre fondo pleno (zona segura).
  const inner = maskable ? Math.round(size * 0.7) : size
  const inline = svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)
  const body = maskable ? inline.replace('rx="16"', 'rx="0"') : inline
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${bg}">${body}</body></html>`)
  await page.screenshot({ path: join(root, 'public/icons', file), omitBackground: bg === 'transparent' })
}

await render('icon-192.png', 192)
await render('icon-512.png', 512)
await render('icon-maskable-512.png', 512, { maskable: true, bg: '#1d1710' })
await render('apple-touch-icon.png', 180, { maskable: true, bg: '#1d1710' })
await browser.close()
console.log('Íconos generados en public/icons')
