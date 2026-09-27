import { defineStore } from 'pinia'

export const PALETAS = [
  { id: 'brand', nombre: 'Ruta Clásica', swatch: ['#141414', '#f5a623', '#ffd23f'] },
  { id: 'azul', nombre: 'Azul Carretera', swatch: ['#0d1b2a', '#1565c0', '#ffb300'] },
  { id: 'rojo', nombre: 'Rojo Rally', swatch: ['#1a1414', '#c62828', '#ffca28'] },
  { id: 'verde', nombre: 'Verde Bosque', swatch: ['#13251a', '#2e7d32', '#ffb300'] },
]

const STORAGE_KEY = 'rn_theme'

function leerPreferenciaGuardada() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* localStorage no disponible */
  }
  return null
}

function prefiereOscuro() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

export const useThemeStore = defineStore('theme', {
  state: () => {
    const guardado = leerPreferenciaGuardada()
    return {
      paleta: guardado?.paleta || 'brand',
      modo: guardado?.modo || (prefiereOscuro() ? 'dark' : 'light'),
    }
  },
  actions: {
    aplicarAlDocumento() {
      if (typeof document === 'undefined') return
      document.documentElement.setAttribute('data-palette', this.paleta)
      document.documentElement.setAttribute('data-mode', this.modo)
    },
    guardar() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ paleta: this.paleta, modo: this.modo }))
      } catch (e) {
        /* ignorar */
      }
    },
    setPaleta(id) {
      this.paleta = id
      this.aplicarAlDocumento()
      this.guardar()
    },
    setModo(modo) {
      this.modo = modo
      this.aplicarAlDocumento()
      this.guardar()
    },
    alternarModo() {
      this.setModo(this.modo === 'light' ? 'dark' : 'light')
    },
    init() {
      this.aplicarAlDocumento()
    },
  },
})
