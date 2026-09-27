// Integración opcional con Firebase (Firestore + Auth).
// Si no se configuran las variables VITE_FIREBASE_*, la tienda funciona
// en "modo demo" guardando todo en localStorage (ver services/products.js).

let app = null
let db = null
let auth = null
let firebaseReady = false

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

firebaseReady = Boolean(config.apiKey && config.projectId && config.appId)

async function inicializar() {
  if (!firebaseReady || app) return
  const { initializeApp } = await import('firebase/app')
  const { getFirestore } = await import('firebase/firestore')
  const { getAuth } = await import('firebase/auth')
  app = initializeApp(config)
  db = getFirestore(app)
  auth = getAuth(app)
}

export function isFirebaseConfigurado() {
  return firebaseReady
}

export async function obtenerFirestore() {
  await inicializar()
  return db
}

export async function obtenerAuth() {
  await inicializar()
  return auth
}
