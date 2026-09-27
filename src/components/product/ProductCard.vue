<script setup>
import { RouterLink } from 'vue-router'
import TireIllustration from './TireIllustration.vue'
import { useCartStore } from '@/store/cart'

const props = defineProps({
  producto: { type: Object, required: true },
})

const cart = useCartStore()
const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

function agregarRapido() {
  cart.agregar(props.producto, 1)
}
</script>

<template>
  <div class="product-card card">
    <RouterLink :to="{ name: 'producto', params: { id: producto.id } }" class="thumb">
      <TireIllustration :color="producto.imagenColor" />
      <span v-if="producto.precioAntes" class="badge badge-danger oferta">Oferta</span>
      <span v-if="producto.stock === 0" class="badge badge-muted sin-stock">Sin stock</span>
    </RouterLink>
    <div class="body">
      <p class="marca">{{ producto.marca }}</p>
      <RouterLink :to="{ name: 'producto', params: { id: producto.id } }" class="nombre">
        {{ producto.nombre }}
      </RouterLink>
      <p class="medida">{{ producto.ancho }}/{{ producto.perfil }} R{{ producto.aro }}</p>
      <div class="precio-row">
        <span v-if="producto.precioAntes" class="price-old">{{ formatoCLP.format(producto.precioAntes) }}</span>
        <span class="price">{{ formatoCLP.format(producto.precio) }}</span>
      </div>
      <button class="btn btn-primary btn-block" :disabled="producto.stock === 0" @click="agregarRapido">
        <i class="bi bi-cart-plus"></i> Agregar
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.thumb {
  position: relative;
  aspect-ratio: 1 / 1;
  padding: 22px;
  background: var(--color-bg-alt);
  display: block;
}
.oferta,
.sin-stock {
  position: absolute;
  top: 10px;
  left: 10px;
}
.body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.marca {
  margin: 0;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  font-weight: 700;
}
.nombre {
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.98rem;
}
.medida {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.precio-row {
  margin-bottom: 10px;
}
</style>
