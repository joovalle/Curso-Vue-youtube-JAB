import { isFirebaseConfigurado, obtenerAuth } from './firebase'

const SESSION_KEY = 'rn_admin_session'
const CLAVE_LOCAL = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
const CORREO_LOCAL = 'admin@rutadelneumatico.cl'

export async function iniciarSesionAdmin(correo, clave) {
  if (isFirebaseConfigurado()) {
    const auth = await obtenerAuth()
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    await signInWithEmailAndPassword(auth, correo, clave)
    return true
  }
  if (clave === CLAVE_LOCAL) {
    sessionStorage.setItem(SESSION_KEY, '1')
    return true
  }
  throw new Error('Clave incorrecta')
}

export async function cerrarSesionAdmin() {
  if (isFirebaseConfigurado()) {
    const auth = await obtenerAuth()
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
    return
  }
  sessionStorage.removeItem(SESSION_KEY)
}

export function correoAdminLocal() {
  return CORREO_LOCAL
}

export function sesionLocalActiva() {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export async function suscribirseAEstadoAuth(callback) {
  if (isFirebaseConfigurado()) {
    const auth = await obtenerAuth()
    const { onAuthStateChanged } = await import('firebase/auth')
    return onAuthStateChanged(auth, (user) => callback(Boolean(user)))
  }
  callback(sesionLocalActiva())
  return () => {}
}
