<script setup>
import { RouterLink } from 'vue-router'
import { useCartStore } from '@/store/cart'
import ThemeSwitcher from './ThemeSwitcher.vue'
import { LOGO_DATA_URI as logo } from '@/assets/logoDataUri'

const cart = useCartStore()
</script>

<template>
  <header class="navbar">
    <div class="container navbar-inner">
      <RouterLink to="/" class="brand">
        <img :src="logo" alt="La Ruta del Neumático" class="brand-logo" />
      </RouterLink>

      <nav class="nav-links">
        <RouterLink to="/catalogo">Catálogo</RouterLink>
        <RouterLink to="/catalogo?categoria=auto">Autos</RouterLink>
        <RouterLink to="/catalogo?categoria=suv">SUV</RouterLink>
        <RouterLink to="/catalogo?categoria=camioneta">Camionetas</RouterLink>
      </nav>

      <div class="nav-actions">
        <ThemeSwitcher />
        <RouterLink to="/carrito" class="cart-link btn btn-primary">
          <i class="bi bi-cart3"></i>
          <span class="cart-count" v-if="cart.totalItems">{{ cart.totalItems }}</span>
        </RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background: var(--color-header-bg);
  color: var(--color-header-text);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}
.navbar-inner {
  display: flex;
  align-items: center;
  gap: 20px;
  height: var(--header-h);
}
.brand {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.brand-logo {
  height: 44px;
  border-radius: 6px;
}
.nav-links {
  display: flex;
  gap: 18px;
  flex: 1;
}
.nav-links a {
  color: var(--color-header-text);
  opacity: 0.85;
  font-weight: 600;
  font-size: 0.92rem;
}
.nav-links a:hover,
.nav-links a.router-link-active {
  opacity: 1;
  color: var(--color-primary);
}
.nav-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nav-actions :deep(.icon-btn) {
  color: var(--color-header-text);
}
.cart-link {
  position: relative;
  padding: 9px 14px;
}
.cart-count {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
  border-radius: 999px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

@media (max-width: 760px) {
  .nav-links {
    display: none;
  }
}
</style>
