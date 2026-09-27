import { defineStore } from 'pinia'
import { iniciarSesionAdmin, cerrarSesionAdmin, suscribirseAEstadoAuth } from '@/services/auth'
import { isFirebaseConfigurado } from '@/services/firebase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    autenticado: false,
    listo: false,
  }),
  getters: {
    modoFirebase: () => isFirebaseConfigurado(),
  },
  actions: {
    async init() {
      await suscribirseAEstadoAuth((autenticado) => {
        this.autenticado = autenticado
        this.listo = true
      })
    },
    async login(correo, clave) {
      await iniciarSesionAdmin(correo, clave)
      this.autenticado = true
    },
    async logout() {
      await cerrarSesionAdmin()
      this.autenticado = false
    },
  },
})
