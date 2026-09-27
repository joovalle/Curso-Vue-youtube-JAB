<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import TireIllustration from '@/components/product/TireIllustration.vue'
import { obtenerProducto } from '@/services/products'
import { useCartStore } from '@/store/cart'

const props = defineProps({ id: { type: String, required: true } })
const router = useRouter()
const cart = useCartStore()

const producto = ref(null)
const cargando = ref(true)
const cantidad = ref(1)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

async function cargar() {
  cargando.value = true
  producto.value = await obtenerProducto(props.id)
  cantidad.value = 1
  cargando.value = false
}

onMounted(cargar)
watch(() => props.id, cargar)

const sinStock = computed(() => !producto.value || producto.value.stock === 0)

function agregarAlCarrito() {
  cart.agregar(producto.value, cantidad.value)
  router.push({ name: 'carrito' })
}
</script>

<template>
  <div class="container section" v-if="cargando">
    <div class="skeleton" style="height: 420px"></div>
  </div>

  <div class="container section" v-else-if="!producto">
    <div class="empty-state">
      <p>No encontramos este neumático.</p>
      <RouterLink to="/catalogo" class="btn btn-primary">Volver al catálogo</RouterLink>
    </div>
  </div>

  <div class="container section detalle" v-else>
    <div class="imagen card">
      <TireIllustration :color="producto.imagenColor" />
    </div>

    <div class="info">
      <p class="marca">{{ producto.marca }}</p>
      <h1>{{ producto.nombre }}</h1>
      <p class="medida"><i class="bi bi-rulers"></i> Medida: {{ producto.ancho }}/{{ producto.perfil }} R{{ producto.aro }}</p>

      <div class="precio-row">
        <span v-if="producto.precioAntes" class="price-old">{{ formatoCLP.format(producto.precioAntes) }}</span>
        <span class="price precio-grande">{{ formatoCLP.format(producto.precio) }}</span>
      </div>

      <p class="stock">
        <span v-if="producto.stock > 0" class="badge badge-success">
          <i class="bi bi-check-circle"></i> {{ producto.stock }} disponibles
        </span>
        <span v-else class="badge badge-danger">Sin stock</span>
      </p>

      <p class="descripcion">{{ producto.descripcion }}</p>

      <div class="acciones" v-if="!sinStock">
        <div class="cantidad">
          <button class="btn btn-outline" @click="cantidad = Math.max(1, cantidad - 1)">-</button>
          <span>{{ cantidad }}</span>
          <button class="btn btn-outline" @click="cantidad = Math.min(producto.stock, cantidad + 1)">+</button>
        </div>
        <button class="btn btn-primary" @click="agregarAlCarrito">
          <i class="bi bi-cart-plus"></i> Agregar al carrito
        </button>
      </div>

      <ul class="beneficios">
        <li><i class="bi bi-truck"></i> Despacho a todo Chile o retiro en sucursal</li>
        <li><i class="bi bi-shield-check"></i> Garantía de fábrica</li>
        <li><i class="bi bi-credit-card"></i> Paga seguro con Mercado Pago</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.detalle {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 32px;
}
.imagen {
  padding: 30px;
}
.marca {
  color: var(--color-text-muted);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.8rem;
  margin: 0;
}
.info h1 {
  margin: 4px 0 10px;
}
.medida {
  color: var(--color-text-muted);
}
.precio-grande {
  font-size: 1.8rem;
}
.stock {
  margin: 10px 0 16px;
}
.descripcion {
  color: var(--color-text-muted);
  line-height: 1.5;
}
.acciones {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 18px 0;
}
.cantidad {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
}
.beneficios {
  list-style: none;
  padding: 0;
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}
.beneficios i {
  color: var(--color-primary);
  margin-right: 6px;
}
@media (max-width: 760px) {
  .detalle {
    grid-template-columns: 1fr;
  }
}
</style>
