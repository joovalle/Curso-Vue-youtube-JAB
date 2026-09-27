<script setup>
import { ref } from 'vue'

const numero = (import.meta.env.VITE_WHATSAPP_NUMBER || '56900000000').replace(/\D/g, '')
const mensaje = encodeURIComponent('Hola, tengo una duda sobre los neumáticos 🚗')
const enlace = `https://wa.me/${numero}?text=${mensaje}`
const abierto = ref(false)
</script>

<template>
  <a
    :href="enlace"
    target="_blank"
    rel="noopener"
    class="whatsapp-fab"
    :class="{ expandido: abierto }"
    @mouseenter="abierto = true"
    @mouseleave="abierto = false"
  >
    <i class="bi bi-whatsapp"></i>
    <span class="texto">¿Tienes dudas? Comunícate con nosotros</span>
  </a>
</template>

<style scoped>
.whatsapp-fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 200;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #25d366;
  color: #fff;
  border-radius: 999px;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  font-weight: 700;
  font-size: 1.6rem;
  line-height: 1;
  transition: padding 0.2s ease, background-color 0.15s ease;
  overflow: hidden;
}
.whatsapp-fab:hover {
  background: #1ebe5b;
  color: #fff;
}
.texto {
  max-width: 0;
  opacity: 0;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: max-width 0.25s ease, opacity 0.2s ease;
}
.whatsapp-fab.expandido .texto {
  max-width: 260px;
  opacity: 1;
}
.whatsapp-fab.expandido {
  padding: 14px 20px;
}

@media (max-width: 640px) {
  .texto {
    display: none;
  }
  .whatsapp-fab {
    font-size: 1.8rem;
  }
}
</style>
