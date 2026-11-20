/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Rutas relativas: el mismo build sirve para web, Capacitor (Android/iOS) y Tauri.
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Lumen — Biblia de estudio',
        short_name: 'Lumen',
        description: 'Lee y estudia la Biblia: libre, sin anuncios y sin conexión.',
        lang: 'es',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#fbfaf7',
        theme_color: '#fbfaf7',
        categories: ['books', 'education', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // La app completa (incluido el motor SQLite) queda disponible sin conexión.
        globPatterns: ['**/*.{js,css,html,wasm,woff2,svg,png}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Los módulos se guardan en IndexedDB al instalarlos; el catálogo se consulta en red con respaldo.
        runtimeCaching: [
          { urlPattern: /modules\/catalog\.json$/, handler: 'NetworkFirst', options: { cacheName: 'lumen-catalog' } },
        ],
      },
    }),
  ],
  worker: { format: 'es' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
