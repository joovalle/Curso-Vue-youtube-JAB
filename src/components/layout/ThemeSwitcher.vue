<script setup>
import { ref } from 'vue'
import { useThemeStore, PALETAS } from '@/store/theme'

const theme = useThemeStore()
const abierto = ref(false)
</script>

<template>
  <div class="theme-switcher">
    <button class="btn btn-ghost icon-btn" @click="theme.alternarModo()" :title="theme.modo === 'light' ? 'Modo oscuro' : 'Modo claro'">
      <i class="bi" :class="theme.modo === 'light' ? 'bi-moon-stars' : 'bi-sun'"></i>
    </button>
    <div class="paleta-wrap">
      <button class="btn btn-ghost icon-btn" @click="abierto = !abierto" title="Elegir paleta de colores">
        <i class="bi bi-palette"></i>
      </button>
      <div v-if="abierto" class="paleta-menu card" @mouseleave="abierto = false">
        <p class="paleta-titulo">Paleta de colores</p>
        <button
          v-for="p in PALETAS"
          :key="p.id"
          class="paleta-opcion"
          :class="{ activa: theme.paleta === p.id }"
          @click="theme.setPaleta(p.id); abierto = false"
        >
          <span class="swatches">
            <span v-for="c in p.swatch" :key="c" class="swatch" :style="{ background: c }"></span>
          </span>
          {{ p.nombre }}
          <i v-if="theme.paleta === p.id" class="bi bi-check-lg check"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
}
.icon-btn {
  padding: 8px 10px;
  font-size: 1.05rem;
}
.paleta-wrap {
  position: relative;
}
.paleta-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: 210px;
  padding: 10px;
  z-index: 50;
  box-shadow: var(--shadow-md);
}
.paleta-titulo {
  margin: 0 0 8px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  font-weight: 700;
}
.paleta-opcion {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text);
  font-size: 0.88rem;
  text-align: left;
}
.paleta-opcion:hover {
  background: var(--color-bg-alt);
}
.paleta-opcion.activa {
  font-weight: 700;
}
.swatches {
  display: inline-flex;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.swatch {
  width: 10px;
  height: 18px;
}
.check {
  margin-left: auto;
  color: var(--color-primary);
}
</style>
