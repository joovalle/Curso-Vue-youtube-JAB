<script setup></script>

<template>
  <div class="container section resultado">
    <h1>404</h1>
    <p class="text-muted">La página que buscas no existe.</p>
    <RouterLink to="/" class="btn btn-primary">Volver al inicio</RouterLink>
  </div>
</template>

<style scoped>
.resultado {
  text-align: center;
  padding: 100px 20px;
}
.resultado h1 {
  font-size: 4rem;
  margin: 0;
  color: var(--color-primary);
}
</style>
