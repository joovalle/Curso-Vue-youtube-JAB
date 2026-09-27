<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const esDemo = route.query.demo === '1'
</script>

<template>
  <div class="container section resultado">
    <i class="bi bi-check-circle-fill icono ok"></i>
    <h1>¡Gracias por tu compra!</h1>
    <p v-if="esDemo" class="text-muted">
      Esto fue una compra de <strong>prueba</strong> (modo demo, sin backend de pago conectado todavía).
      Cuando conectes tus credenciales de Mercado Pago, este mismo flujo procesará pagos reales.
    </p>
    <p v-else class="text-muted">Te enviaremos la confirmación y el seguimiento de tu pedido a tu correo.</p>
    <div class="acciones">
      <RouterLink to="/catalogo" class="btn btn-primary">Seguir comprando</RouterLink>
      <RouterLink to="/" class="btn btn-outline">Volver al inicio</RouterLink>
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
.ok {
  color: var(--color-success);
}
.acciones {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}
</style>
