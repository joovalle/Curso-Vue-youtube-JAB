<script setup>
import { MEDIDAS_ANCHO, MEDIDAS_PERFIL, MEDIDAS_ARO } from '@/data/products.seed'

const modelo = defineModel({
  type: Object,
  default: () => ({ ancho: '', perfil: '', aro: '' }),
})

const emit = defineEmits(['buscar'])
</script>

<template>
  <form class="tire-filter card" @submit.prevent="emit('buscar')">
    <p class="titulo"><i class="bi bi-search"></i> Busca por medida de neumático</p>
    <div class="campos">
      <div class="form-group">
        <label>Ancho</label>
        <select v-model="modelo.ancho" class="input">
          <option value="">Todos</option>
          <option v-for="v in MEDIDAS_ANCHO" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Perfil</label>
        <select v-model="modelo.perfil" class="input">
          <option value="">Todos</option>
          <option v-for="v in MEDIDAS_PERFIL" :key="v" :value="v">{{ v }}</option>
        </select>
      </div>
      <div class="form-group">
        <label>Aro</label>
        <select v-model="modelo.aro" class="input">
          <option value="">Todos</option>
          <option v-for="v in MEDIDAS_ARO" :key="v" :value="v">R{{ v }}</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary buscar-btn">
        <i class="bi bi-search"></i> Buscar
      </button>
    </div>
  </form>
</template>

<style scoped>
.tire-filter {
  padding: 18px;
}
.titulo {
  margin: 0 0 12px;
  font-weight: 700;
}
.campos {
  display: grid;
  grid-template-columns: repeat(3, 1fr) auto;
  gap: 12px;
  align-items: end;
}
.buscar-btn {
  height: 40px;
}
@media (max-width: 700px) {
  .campos {
    grid-template-columns: 1fr 1fr;
  }
  .buscar-btn {
    grid-column: span 2;
  }
}
</style>
