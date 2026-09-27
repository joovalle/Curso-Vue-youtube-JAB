<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/product/ProductCard.vue'
import TireSizeFilter from '@/components/product/TireSizeFilter.vue'
import { listarProductos } from '@/services/products'

const router = useRouter()
const productos = ref([])
const cargando = ref(true)
const medida = ref({ ancho: '', perfil: '', aro: '' })

onMounted(async () => {
  productos.value = await listarProductos()
  cargando.value = false
})

const destacados = computed(() => productos.value.filter((p) => p.destacado).slice(0, 8))

function buscar() {
  router.push({ name: 'catalogo', query: { ...medida.value } })
}
</script>

<template>
  <section class="hero">
    <div class="container hero-inner">
      <div class="hero-texto">
        <h1>Las mejores marcas, al mejor precio.</h1>
        <p>Envíos a todo Chile o retiro en sucursal. Encuentra la medida exacta de tu vehículo en segundos.</p>
        <div class="hero-badges">
          <span><i class="bi bi-award"></i> Las mejores marcas</span>
          <span><i class="bi bi-truck"></i> Envíos a todo Chile</span>
          <span><i class="bi bi-shield-check"></i> Calidad y confianza</span>
        </div>
      </div>
    </div>
  </section>

  <div class="container filtro-flotante">
    <TireSizeFilter v-model="medida" @buscar="buscar" />
  </div>

  <section class="section container">
    <h2 class="section-title">Destacados</h2>
    <div v-if="cargando" class="grid-products">
      <div v-for="i in 4" :key="i" class="skeleton" style="height: 320px"></div>
    </div>
    <div v-else class="grid-products">
      <ProductCard v-for="p in destacados" :key="p.id" :producto="p" />
    </div>
    <div class="ver-mas">
      <RouterLink to="/catalogo" class="btn btn-outline">Ver catálogo completo</RouterLink>
    </div>
  </section>

  <section class="section container categorias">
    <RouterLink :to="{ name: 'catalogo', query: { categoria: 'auto' } }" class="cat-card card">
      <i class="bi bi-car-front"></i>
      <span>Autos</span>
    </RouterLink>
    <RouterLink :to="{ name: 'catalogo', query: { categoria: 'suv' } }" class="cat-card card">
      <i class="bi bi-truck-front"></i>
      <span>SUV</span>
    </RouterLink>
    <RouterLink :to="{ name: 'catalogo', query: { categoria: 'camioneta' } }" class="cat-card card">
      <i class="bi bi-truck"></i>
      <span>Camionetas</span>
    </RouterLink>
  </section>
</template>

<style scoped>
.hero {
  background: linear-gradient(120deg, var(--color-header-bg), #000 130%);
  color: #fff;
  padding: 56px 0 90px;
}
.hero-texto h1 {
  font-size: 2.4rem;
  margin: 0 0 12px;
  max-width: 640px;
}
.hero-texto p {
  opacity: 0.85;
  max-width: 560px;
  margin: 0 0 20px;
}
.hero-badges {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-weight: 700;
  font-size: 0.85rem;
}
.hero-badges span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
}
.filtro-flotante {
  margin-top: -50px;
  position: relative;
  z-index: 5;
}
.ver-mas {
  text-align: center;
  margin-top: 24px;
}
.categorias {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.cat-card {
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  color: var(--color-text);
}
.cat-card i {
  font-size: 2rem;
  color: var(--color-primary);
}
.cat-card:hover {
  border-color: var(--color-primary);
}
@media (max-width: 700px) {
  .categorias {
    grid-template-columns: 1fr;
  }
  .hero-texto h1 {
    font-size: 1.8rem;
  }
}
</style>
