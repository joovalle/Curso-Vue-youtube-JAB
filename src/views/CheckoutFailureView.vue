<script setup></script>

<template>
  <div class="container section resultado">
    <i class="bi bi-x-circle-fill icono error"></i>
    <h1>Tu pago no se pudo procesar</h1>
    <p class="text-muted">No se realizó ningún cobro. Puedes intentarlo nuevamente o contactarnos por WhatsApp si el problema persiste.</p>
    <div class="acciones">
      <RouterLink to="/checkout" class="btn btn-primary">Reintentar pago</RouterLink>
      <RouterLink to="/carrito" class="btn btn-outline">Volver al carrito</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.resultado {
  text-align: center;
  max-width: 520px;
  margin: 0 auto;
}
.icono {
  font-size: 4rem;
}
.error {
  color: var(--color-danger);
}
.acciones {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}
</style>
