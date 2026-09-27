<script setup>
import { ref } from 'vue'
import { modoDemo } from '@/services/products'

const visible = ref(modoDemo())
</script>

<template>
  <div v-if="visible" class="demo-banner">
    <i class="bi bi-info-circle"></i>
    Sitio en modo demo: catálogo y pagos de prueba, sin cobros reales.
    <button class="cerrar" @click="visible = false" aria-label="Cerrar aviso">
      <i class="bi bi-x-lg"></i>
    </button>
  </div>
</template>

<style scoped>
.demo-banner {
  position: relative;
}
.cerrar {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.75;
}
.cerrar:hover {
  opacity: 1;
}
</style>
