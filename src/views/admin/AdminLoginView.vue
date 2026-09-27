<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { LOGO_DATA_URI as logo } from '@/assets/logoDataUri'

const auth = useAuthStore()
const router = useRouter()

const correo = ref('')
const clave = ref('')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  cargando.value = true
  try {
    await auth.login(correo.value, clave.value)
    router.push({ name: 'admin' })
  } catch (e) {
    error.value = 'Datos incorrectos. Verifica e intenta nuevamente.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <form class="login-card card" @submit.prevent="enviar">
      <img :src="logo" alt="La Ruta del Neumático" class="logo" />
      <h2>Panel de administración</h2>

      <div class="form-group" v-if="auth.modoFirebase">
        <label>Correo</label>
        <input class="input" type="email" v-model="correo" required autocomplete="username" />
      </div>
      <div class="form-group">
        <label>Clave</label>
        <input class="input" type="password" v-model="clave" required autocomplete="current-password" />
      </div>

      <p v-if="!auth.modoFirebase" class="text-muted ayuda">
        Modo demo: usa la clave definida en <code>VITE_ADMIN_PASSWORD</code> (por defecto <code>admin123</code>).
      </p>

      <p v-if="error" class="error-msg"><i class="bi bi-exclamation-triangle"></i> {{ error }}</p>

      <button class="btn btn-primary btn-block" :disabled="cargando">
        {{ cargando ? 'Ingresando...' : 'Ingresar' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.login-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 16px;
  min-height: 60vh;
}
.login-card {
  width: 100%;
  max-width: 380px;
  padding: 28px;
  text-align: center;
}
.logo {
  height: 46px;
  border-radius: 6px;
  margin-bottom: 12px;
}
.login-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.2rem;
}
.ayuda {
  font-size: 0.8rem;
  text-align: left;
  margin: -4px 0 14px;
}
.error-msg {
  color: var(--color-danger);
  font-size: 0.85rem;
  margin-bottom: 12px;
}
</style>
