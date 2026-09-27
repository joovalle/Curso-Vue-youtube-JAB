<script setup>
import { useCartStore } from '@/store/cart'

const cart = useCartStore()
const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
</script>

<template>
  <div class="container section">
    <h1 class="section-title">Tu carrito</h1>

    <div v-if="cart.estaVacio" class="empty-state">
      <i class="bi bi-cart-x" style="font-size: 2.4rem"></i>
      <p>Tu carrito está vacío.</p>
      <RouterLink to="/catalogo" class="btn btn-primary">Ir al catálogo</RouterLink>
    </div>

    <div v-else class="carrito-grid">
      <div class="items">
        <div v-for="item in cart.items" :key="item.id" class="item card">
          <div class="item-info">
            <p class="nombre">{{ item.marca }} {{ item.nombre }}</p>
            <p class="medida text-muted">{{ item.medida }}</p>
            <p class="precio-unit text-muted">{{ formatoCLP.format(item.precio) }} c/u</p>
          </div>
          <div class="cantidad">
            <button class="btn btn-outline" @click="cart.decrementar(item.id)">-</button>
            <span>{{ item.cantidad }}</span>
            <button class="btn btn-outline" @click="cart.incrementar(item.id)" :disabled="item.cantidad >= item.stock">+</button>
          </div>
          <div class="subtotal">{{ formatoCLP.format(item.precio * item.cantidad) }}</div>
          <button class="btn btn-ghost quitar" @click="cart.eliminar(item.id)" title="Quitar">
            <i class="bi bi-trash"></i>
          </button>
        </div>

        <button class="btn btn-outline vaciar" @click="cart.vaciar()">
          <i class="bi bi-x-circle"></i> Vaciar carrito
        </button>
      </div>

      <aside class="resumen card">
        <h3>Resumen</h3>
        <div class="fila">
          <span>Productos ({{ cart.totalItems }})</span>
          <span>{{ formatoCLP.format(cart.subtotal) }}</span>
        </div>
        <p class="text-muted nota">El costo de envío se calcula en el siguiente paso.</p>
        <RouterLink to="/checkout" class="btn btn-primary btn-block">
          Ir a pagar <i class="bi bi-arrow-right"></i>
        </RouterLink>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.carrito-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  align-items: start;
}
.item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.nombre {
  margin: 0;
  font-weight: 700;
}
.medida,
.precio-unit {
  margin: 2px 0 0;
  font-size: 0.85rem;
}
.cantidad {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.subtotal {
  font-weight: 800;
  min-width: 90px;
  text-align: right;
}
.quitar {
  color: var(--color-danger);
}
.vaciar {
  margin-top: 6px;
}
.resumen {
  padding: 20px;
  position: sticky;
  top: calc(var(--header-h) + 16px);
}
.resumen h3 {
  margin-top: 0;
}
.fila {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  margin: 12px 0;
}
.nota {
  font-size: 0.8rem;
  margin-bottom: 16px;
}
@media (max-width: 800px) {
  .carrito-grid {
    grid-template-columns: 1fr;
  }
  .item {
    grid-template-columns: 1fr auto;
    grid-template-areas: 'info quitar' 'cantidad subtotal';
  }
}
</style>
