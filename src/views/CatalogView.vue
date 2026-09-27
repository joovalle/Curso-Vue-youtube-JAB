<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import TireSizeFilter from '@/components/product/TireSizeFilter.vue'
import { listarProductos } from '@/services/products'

const route = useRoute()
const productos = ref([])
const cargando = ref(true)
const medida = ref({ ancho: '', perfil: '', aro: '' })
const categoria = ref('')

async function cargar() {
  cargando.value = true
  productos.value = await listarProductos()
  cargando.value = false
}

function leerQuery() {
  medida.value = {
    ancho: route.query.ancho ? Number(route.query.ancho) : '',
    perfil: route.query.perfil ? Number(route.query.perfil) : '',
    aro: route.query.aro ? Number(route.query.aro) : '',
  }
  categoria.value = route.query.categoria || ''
}

onMounted(() => {
  leerQuery()
  cargar()
})

watch(() => route.query, leerQuery)

const filtrados = computed(() =>
  productos.value.filter((p) => {
    if (medida.value.ancho && p.ancho !== medida.value.ancho) return false
    if (medida.value.perfil && p.perfil !== medida.value.perfil) return false
    if (medida.value.aro && p.aro !== medida.value.aro) return false
    if (categoria.value && p.categoria !== categoria.value) return false
    return true
  })
)

const categorias = [
  { id: '', nombre: 'Todas' },
  { id: 'auto', nombre: 'Autos' },
  { id: 'suv', nombre: 'SUV' },
  { id: 'camioneta', nombre: 'Camionetas' },
]
</script>

<template>
  <div class="container section">
    <h1 class="section-title">Catálogo de neumáticos</h1>

    <TireSizeFilter v-model="medida" @buscar="() => {}" />

    <div class="chips">
      <button
        v-for="c in categorias"
        :key="c.id"
        class="chip"
        :class="{ activo: categoria === c.id }"
        @click="categoria = c.id"
      >
        {{ c.nombre }}
      </button>
    </div>

    <p class="resultados text-muted">{{ filtrados.length }} resultado(s)</p>

    <div v-if="cargando" class="grid-products">
      <div v-for="i in 8" :key="i" class="skeleton" style="height: 320px"></div>
    </div>
    <div v-else-if="filtrados.length" class="grid-products">
      <ProductCard v-for="p in filtrados" :key="p.id" :producto="p" />
    </div>
    <div v-else class="empty-state">
      <i class="bi bi-emoji-frown" style="font-size: 2rem"></i>
      <p>No encontramos neumáticos con esa medida. Prueba otra combinación.</p>
    </div>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  gap: 8px;
  margin: 18px 0 6px;
  flex-wrap: wrap;
}
.chip {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 6px 16px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
}
.chip.activo {
  background: var(--color-primary);
  color: var(--color-primary-contrast);
  border-color: var(--color-primary);
}
.resultados {
  margin: 10px 0 16px;
}
</style>
