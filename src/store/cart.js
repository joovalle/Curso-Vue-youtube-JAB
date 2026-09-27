import { defineStore } from 'pinia'

const STORAGE_KEY = 'rn_cart'

function leerCarritoGuardado() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: leerCarritoGuardado(),
  }),
  getters: {
    totalItems: (state) => state.items.reduce((acc, it) => acc + it.cantidad, 0),
    subtotal: (state) => state.items.reduce((acc, it) => acc + it.cantidad * it.precio, 0),
    estaVacio: (state) => state.items.length === 0,
  },
  actions: {
    persistir() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
      } catch (e) {
        /* ignorar */
      }
    },
    agregar(producto, cantidad = 1) {
      const existente = this.items.find((it) => it.id === producto.id)
      const stockDisponible = producto.stock ?? Infinity
      if (existente) {
        existente.cantidad = Math.min(existente.cantidad + cantidad, stockDisponible)
      } else {
        this.items.push({
          id: producto.id,
          nombre: producto.nombre,
          marca: producto.marca,
          medida: `${producto.ancho}/${producto.perfil} R${producto.aro}`,
          precio: producto.precio,
          imagenColor: producto.imagenColor,
          stock: stockDisponible,
          cantidad: Math.min(cantidad, stockDisponible),
        })
      }
      this.persistir()
    },
    incrementar(id) {
      const item = this.items.find((it) => it.id === id)
      if (item && item.cantidad < (item.stock ?? Infinity)) {
        item.cantidad++
        this.persistir()
      }
    },
    decrementar(id) {
      const item = this.items.find((it) => it.id === id)
      if (item) {
        item.cantidad--
        if (item.cantidad <= 0) {
          this.eliminar(id)
        } else {
          this.persistir()
        }
      }
    },
    eliminar(id) {
      this.items = this.items.filter((it) => it.id !== id)
      this.persistir()
    },
    vaciar() {
      this.items = []
      this.persistir()
    },
  },
})
