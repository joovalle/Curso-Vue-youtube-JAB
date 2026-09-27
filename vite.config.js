import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // Necesario para GitHub Pages (sitio de proyecto: usuario.github.io/<repo>/).
  // Si despliegas en Vercel/Netlify (dominio propio o *.vercel.app), cambia esto a '/'.
  base: process.env.VITE_BASE_PATH || '/curso-vue-youtube-jab/',
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
