<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  producto: { type: Object, default: null },
})
const emit = defineEmits(['guardar', 'cancelar'])

const vacio = () => ({
  id: null,
  nombre: '',
  marca: '',
  ancho: '',
  perfil: '',
  aro: '',
  categoria: 'auto',
  precio: '',
  precioAntes: '',
  stock: '',
  destacado: false,
  imagenColor: '#f5a623',
  descripcion: '',
})

const form = ref(props.producto ? { ...props.producto } : vacio())

watch(
  () => props.producto,
  (nuevo) => {
    form.value = nuevo ? { ...nuevo } : vacio()
  }
)

function enviar() {
  const datos = {
    ...form.value,
    ancho: Number(form.value.ancho),
    perfil: Number(form.value.perfil),
    aro: Number(form.value.aro),
    precio: Number(form.value.precio),
    precioAntes: form.value.precioAntes ? Number(form.value.precioAntes) : null,
    stock: Number(form.value.stock),
  }
  emit('guardar', datos)
}
</script>

<template>
  <form class="product-form" @submit.prevent="enviar">
    <div class="dos-col">
      <div class="form-group">
        <label>Marca *</label>
        <input class="input" v-model="form.marca" required placeholder="Michelin" />
      </div>
      <div class="form-group">
        <label>Modelo *</label>
        <input class="input" v-model="form.nombre" required placeholder="Energy XM2+" />
      </div>
    </div>

    <div class="tres-col">
      <div class="form-group">
        <label>Ancho *</label>
        <input class="input" type="number" v-model="form.ancho" required placeholder="205" />
      </div>
      <div class="form-group">
        <label>Perfil *</label>
        <input class="input" type="number" v-model="form.perfil" required placeholder="55" />
      </div>
      <div class="form-group">
        <label>Aro *</label>
        <input class="input" type="number" v-model="form.aro" required placeholder="16" />
      </div>
    </div>

    <div class="dos-col">
      <div class="form-group">
        <label>Precio *</label>
        <input class="input" type="number" v-model="form.precio" required placeholder="89990" />
      </div>
      <div class="form-group">
        <label>Precio antes (oferta)</label>
        <input class="input" type="number" v-model="form.precioAntes" placeholder="Opcional" />
      </div>
    </div>

    <div class="dos-col">
      <div class="form-group">
        <label>Stock *</label>
        <input class="input" type="number" v-model="form.stock" required placeholder="10" />
      </div>
      <div class="form-group">
        <label>Categoría</label>
        <select class="input" v-model="form.categoria">
          <option value="auto">Auto</option>
          <option value="suv">SUV</option>
          <option value="camioneta">Camioneta</option>
        </select>
      </div>
    </div>

    <div class="dos-col">
      <div class="form-group">
        <label>Color ilustración</label>
        <input class="input" type="color" v-model="form.imagenColor" />
      </div>
      <div class="form-group check-group">
        <label class="check-label">
          <input type="checkbox" v-model="form.destacado" />
          Destacar en la portada
        </label>
      </div>
    </div>

    <div class="form-group">
      <label>Descripción</label>
      <textarea class="input" v-model="form.descripcion" rows="3"></textarea>
    </div>

    <div class="acciones">
      <button type="button" class="btn btn-outline" @click="emit('cancelar')">Cancelar</button>
      <button type="submit" class="btn btn-primary">
        <i class="bi bi-check-lg"></i> Guardar
      </button>
    </div>
  </form>
</template>

<style scoped>
.dos-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.tres-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.check-group {
  display: flex;
  align-items: center;
}
.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--color-text);
  margin-top: 18px;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}
@media (max-width: 600px) {
  .dos-col,
  .tres-col {
    grid-template-columns: 1fr;
  }
}
</style>
