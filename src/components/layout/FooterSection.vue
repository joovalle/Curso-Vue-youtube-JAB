<script setup>
import { LOGO_DATA_URI as logo } from '@/assets/logoDataUri'

const anio = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <img :src="logo" alt="La Ruta del Neumático" class="footer-logo" />
        <p class="text-muted">
          Neumáticos de las mejores marcas, con despacho a todo Chile o retiro en sucursal.
        </p>
      </div>

      <div class="footer-col">
        <h4>Tienda</h4>
        <RouterLink to="/catalogo">Catálogo</RouterLink>
        <RouterLink to="/carrito">Carrito</RouterLink>
        <RouterLink to="/admin/login">Panel administrador</RouterLink>
      </div>

      <div class="footer-col">
        <h4>Ayuda</h4>
        <span>Envíos a todo Chile</span>
        <span>Retiro en sucursal</span>
        <span>Pago seguro con Mercado Pago</span>
      </div>

      <div class="footer-col">
        <h4>Contacto</h4>
        <span><i class="bi bi-geo-alt"></i> Santiago, Chile</span>
        <span><i class="bi bi-envelope"></i> contacto@rutadelneumatico.cl</span>
        <span><i class="bi bi-whatsapp"></i> +56 9 0000 0000</span>
      </div>
    </div>
    <div class="footer-bottom">
      © {{ anio }} La Ruta del Neumático. Todos los derechos reservados.
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--color-header-bg);
  color: var(--color-header-text);
  margin-top: 40px;
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 24px;
  padding: 40px 16px 24px;
}
.footer-logo {
  height: 40px;
  border-radius: 6px;
  margin-bottom: 10px;
}
.footer-brand p {
  opacity: 0.75;
  font-size: 0.88rem;
  max-width: 280px;
}
.footer-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.88rem;
}
.footer-col h4 {
  margin: 0 0 6px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-primary);
}
.footer-col a,
.footer-col span {
  color: var(--color-header-text);
  opacity: 0.85;
}
.footer-col a:hover {
  opacity: 1;
  color: var(--color-primary);
}
.footer-bottom {
  text-align: center;
  padding: 14px;
  font-size: 0.78rem;
  opacity: 0.6;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 760px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
