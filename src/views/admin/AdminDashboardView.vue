<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { listarProductos, guardarProducto, eliminarProducto, modoDemo } from '@/services/products'
import ProductForm from '@/components/admin/ProductForm.vue'

const auth = useAuthStore()
const router = useRouter()

const productos = ref([])
const cargando = ref(true)
const busqueda = ref('')
const editando = ref(null)
const mostrandoForm = ref(false)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

async function cargar() {
  cargando.value = true
  productos.value = await listarProductos()
  cargando.value = false
}

onMounted(cargar)

const filtrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return productos.value
  return productos.value.filter((p) =>
    `${p.marca} ${p.nombre} ${p.ancho} ${p.perfil} ${p.aro}`.toLowerCase().includes(q)
  )
})

function nuevoProducto() {
  editando.value = null
  mostrandoForm.value = true
}

function editarProducto(p) {
  editando.value = p
  mostrandoForm.value = true
}

async function guardar(datos) {
  await guardarProducto(datos)
  mostrandoForm.value = false
  await cargar()
}

async function eliminar(p) {
  if (!confirm(`¿Eliminar "${p.marca} ${p.nombre}"? Esta acción no se puede deshacer.`)) return
  await eliminarProducto(p.id)
  await cargar()
}

async function salir() {
  await auth.logout()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="container section admin">
    <div class="admin-header">
      <div>
        <h1 class="section-title">Panel de administración</h1>
        <p class="text-muted">
          Gestiona el stock de neumáticos.
          <span v-if="modoDemo()" class="badge badge-muted">Modo demo (localStorage)</span>
          <span v-else class="badge badge-success">Conectado a Firebase</span>
        </p>
      </div>
      <div class="admin-header-acciones">
        <button class="btn btn-primary" @click="nuevoProducto">
          <i class="bi bi-plus-lg"></i> Nuevo producto
        </button>
        <button class="btn btn-outline" @click="salir">
          <i class="bi bi-box-arrow-right"></i> Salir
        </button>
      </div>
    </div>

    <div v-if="mostrandoForm" class="card form-panel">
      <h3>{{ editando ? 'Editar producto' : 'Nuevo producto' }}</h3>
      <ProductForm :producto="editando" @guardar="guardar" @cancelar="mostrandoForm = false" />
    </div>

    <div class="form-group buscador">
      <input class="input" v-model="busqueda" placeholder="Buscar por marca, modelo o medida..." />
    </div>

    <div class="card tabla-wrap">
      <table class="table" v-if="!cargando">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Medida</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in filtrados" :key="p.id">
            <td>
              <strong>{{ p.marca }}</strong> {{ p.nombre }}
              <span v-if="p.destacado" class="badge badge-success destacado-tag">Destacado</span>
            </td>
            <td>{{ p.ancho }}/{{ p.perfil }} R{{ p.aro }}</td>
            <td class="capitalize">{{ p.categoria }}</td>
            <td>{{ formatoCLP.format(p.precio) }}</td>
            <td>
              <span :class="p.stock > 0 ? 'badge badge-success' : 'badge badge-danger'">{{ p.stock }}</span>
            </td>
            <td class="acciones-fila">
              <button class="btn btn-ghost" @click="editarProducto(p)" title="Editar">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-ghost" @click="eliminar(p)" title="Eliminar">
                <i class="bi bi-trash text-danger"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!cargando && !filtrados.length" class="empty-state">Sin productos que coincidan.</div>
    </div>
  </div>
</template>

<style scoped>
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.admin-header-acciones {
  display: flex;
  gap: 10px;
}
.form-panel {
  padding: 20px;
  margin: 20px 0;
}
.buscador {
  max-width: 360px;
  margin: 20px 0 12px;
}
.tabla-wrap {
  overflow-x: auto;
  padding: 8px 16px;
}
.acciones-fila {
  display: flex;
  gap: 4px;
}
.destacado-tag {
  margin-left: 8px;
}
.capitalize {
  text-transform: capitalize;
}
.text-danger {
  color: var(--color-danger);
}
</style>
