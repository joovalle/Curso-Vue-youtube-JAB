<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/store/cart'
import { REGIONES, comunasDeRegion } from '@/data/regionesComunas'
import { SUCURSALES } from '@/data/sucursales'
import { calcularEnvio } from '@/services/shipping'
import { iniciarPago } from '@/services/mercadopago'
import { descontarStock } from '@/services/products'

const cart = useCartStore()
const router = useRouter()

if (cart.estaVacio) {
  router.replace({ name: 'carrito' })
}

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const metodo = ref('despacho') // 'despacho' | 'retiro'
const sucursalId = ref(SUCURSALES[0]?.id)
const cliente = ref({ nombre: '', correo: '', telefono: '' })
const direccion = ref({ regionId: '', comuna: '', calle: '', numero: '', depto: '' })
const enviando = ref(false)
const error = ref('')

const comunasDisponibles = computed(() => comunasDeRegion(direccion.value.regionId))
watch(() => direccion.value.regionId, () => (direccion.value.comuna = ''))

const envio = computed(() =>
  calcularEnvio({
    metodo: metodo.value,
    regionId: direccion.value.regionId,
    subtotal: cart.subtotal,
  })
)

const total = computed(() => cart.subtotal + (envio.value.costo || 0))

const formularioValido = computed(() => {
  if (!cliente.value.nombre || !cliente.value.correo) return false
  if (metodo.value === 'retiro') return Boolean(sucursalId.value)
  return Boolean(direccion.value.regionId && direccion.value.comuna && direccion.value.calle)
})

async function pagar() {
  error.value = ''
  if (!formularioValido.value) {
    error.value = 'Completa los datos obligatorios antes de continuar.'
    return
  }
  enviando.value = true
  try {
    const orden = {
      items: cart.items,
      subtotal: cart.subtotal,
      costoEnvio: envio.value.costo || 0,
      total: total.value,
      cliente: cliente.value,
      entrega:
        metodo.value === 'retiro'
          ? { tipo: 'retiro', sucursal: SUCURSALES.find((s) => s.id === sucursalId.value) }
          : { tipo: 'despacho', direccion: direccion.value },
      fecha: new Date().toISOString(),
    }

    const resultado = await iniciarPago(orden)

    for (const item of cart.items) {
      await descontarStock(item.id, item.cantidad)
    }

    if (resultado.modo === 'demo') {
      cart.vaciar()
      router.push({ name: 'checkout-exito', query: { demo: '1' } })
    }
    // Si modo === 'mercadopago', el navegador ya fue redirigido a Mercado Pago.
  } catch (e) {
    error.value = 'Ocurrió un problema al procesar tu pedido. Intenta nuevamente.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="container section checkout" v-if="!cart.estaVacio">
    <h1 class="section-title">Finalizar compra</h1>

    <div class="checkout-grid">
      <div class="form-col">
        <div class="card paso">
          <h3>1. Tus datos</h3>
          <div class="form-group">
            <label>Nombre completo *</label>
            <input class="input" v-model="cliente.nombre" placeholder="Ej: Juan Pérez" />
          </div>
          <div class="dos-col">
            <div class="form-group">
              <label>Correo *</label>
              <input class="input" type="email" v-model="cliente.correo" placeholder="correo@ejemplo.com" />
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input class="input" v-model="cliente.telefono" placeholder="+56 9 1234 5678" />
            </div>
          </div>
        </div>

        <div class="card paso">
          <h3>2. Método de entrega</h3>
          <div class="metodo-opciones">
            <label class="opcion" :class="{ activa: metodo === 'despacho' }">
              <input type="radio" value="despacho" v-model="metodo" />
              <i class="bi bi-truck"></i>
              <div>
                <strong>Despacho a domicilio</strong>
                <p class="text-muted">Recíbelo donde estés</p>
              </div>
            </label>
            <label class="opcion" :class="{ activa: metodo === 'retiro' }">
              <input type="radio" value="retiro" v-model="metodo" />
              <i class="bi bi-shop"></i>
              <div>
                <strong>Retiro en sucursal</strong>
                <p class="text-muted">Sin costo de envío</p>
              </div>
            </label>
          </div>

          <div v-if="metodo === 'despacho'" class="direccion-form">
            <div class="dos-col">
              <div class="form-group">
                <label>Región *</label>
                <select class="input" v-model="direccion.regionId">
                  <option value="">Selecciona tu región</option>
                  <option v-for="r in REGIONES" :key="r.id" :value="r.id">{{ r.nombre }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Comuna *</label>
                <select class="input" v-model="direccion.comuna" :disabled="!direccion.regionId">
                  <option value="">Selecciona tu comuna</option>
                  <option v-for="c in comunasDisponibles" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>
            <div class="dos-col">
              <div class="form-group">
                <label>Calle *</label>
                <input class="input" v-model="direccion.calle" placeholder="Av. Siempre Viva" />
              </div>
              <div class="form-group">
                <label>Número</label>
                <input class="input" v-model="direccion.numero" placeholder="1234" />
              </div>
            </div>
            <div class="form-group">
              <label>Depto / Casa (opcional)</label>
              <input class="input" v-model="direccion.depto" placeholder="Depto 501" />
            </div>
          </div>

          <div v-else class="sucursal-form">
            <div class="form-group">
              <label>Elige sucursal *</label>
              <div class="sucursales">
                <label v-for="s in SUCURSALES" :key="s.id" class="sucursal" :class="{ activa: sucursalId === s.id }">
                  <input type="radio" :value="s.id" v-model="sucursalId" />
                  <div>
                    <strong>{{ s.nombre }}</strong>
                    <p class="text-muted">{{ s.direccion }}</p>
                    <p class="text-muted">{{ s.horario }}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="resumen card">
        <h3>Resumen del pedido</h3>
        <div class="fila" v-for="item in cart.items" :key="item.id">
          <span>{{ item.cantidad }}x {{ item.nombre }} ({{ item.medida }})</span>
          <span>{{ formatoCLP.format(item.precio * item.cantidad) }}</span>
        </div>
        <hr />
        <div class="fila">
          <span>Subtotal</span>
          <span>{{ formatoCLP.format(cart.subtotal) }}</span>
        </div>
        <div class="fila">
          <span>Envío</span>
          <span v-if="metodo === 'despacho' && !direccion.regionId" class="text-muted">Selecciona tu región</span>
          <span v-else-if="envio.gratis" class="badge badge-success">Gratis</span>
          <span v-else>{{ formatoCLP.format(envio.costo) }}</span>
        </div>
        <p v-if="metodo === 'despacho' && direccion.regionId" class="text-muted eta">
          <i class="bi bi-clock"></i> {{ envio.etaDias }}
        </p>
        <hr />
        <div class="fila total">
          <span>Total</span>
          <span>{{ formatoCLP.format(total) }}</span>
        </div>

        <p v-if="error" class="error-msg"><i class="bi bi-exclamation-triangle"></i> {{ error }}</p>

        <button class="btn btn-primary btn-block" :disabled="enviando" @click="pagar">
          <i class="bi bi-credit-card"></i>
          {{ enviando ? 'Procesando...' : 'Pagar con Mercado Pago' }}
        </button>
        <p class="text-muted seguro"><i class="bi bi-lock"></i> Pago protegido por Mercado Pago</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}
.paso {
  padding: 20px;
  margin-bottom: 20px;
}
.paso h3 {
  margin-top: 0;
}
.dos-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.metodo-opciones {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.opcion {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 14px;
  cursor: pointer;
}
.opcion input {
  position: absolute;
  opacity: 0;
}
.opcion i {
  font-size: 1.5rem;
  color: var(--color-primary);
}
.opcion.activa {
  border-color: var(--color-primary);
  background: var(--color-bg-alt);
}
.sucursales {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sucursal {
  display: flex;
  gap: 10px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  cursor: pointer;
}
.sucursal input {
  margin-top: 4px;
}
.sucursal.activa {
  border-color: var(--color-primary);
  background: var(--color-bg-alt);
}
.resumen {
  padding: 20px;
  position: sticky;
  top: calc(var(--header-h) + 16px);
}
.fila {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
  margin: 8px 0;
}
.total {
  font-weight: 800;
  font-size: 1.1rem;
}
.eta {
  font-size: 0.8rem;
  margin: -4px 0 0;
}
.error-msg {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin: 10px 0;
}
.seguro {
  text-align: center;
  font-size: 0.78rem;
  margin-top: 10px;
}
@media (max-width: 800px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }
  .dos-col,
  .metodo-opciones {
    grid-template-columns: 1fr;
  }
}
</style>
