import { isFirebaseConfigurado, obtenerFirestore } from './firebase'
import { PRODUCTOS_DEMO } from '@/data/products.seed'

const STORAGE_KEY = 'rn_products'

function leerLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    /* ignorar */
  }
  // Primera vez: sembramos con el catálogo de ejemplo.
  guardarLocal(PRODUCTOS_DEMO)
  return PRODUCTOS_DEMO
}

function guardarLocal(productos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(productos))
  } catch (e) {
    /* ignorar */
  }
}

export function modoDemo() {
  return !isFirebaseConfigurado()
}

export async function listarProductos() {
  if (isFirebaseConfigurado()) {
    const db = await obtenerFirestore()
    const { collection, getDocs } = await import('firebase/firestore')
    const snap = await getDocs(collection(db, 'productos'))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  return leerLocal()
}

export async function obtenerProducto(id) {
  const productos = await listarProductos()
  return productos.find((p) => p.id === id) || null
}

export async function guardarProducto(producto) {
  if (isFirebaseConfigurado()) {
    const db = await obtenerFirestore()
    const { collection, doc, setDoc, addDoc } = await import('firebase/firestore')
    if (producto.id) {
      const { id, ...datos } = producto
      await setDoc(doc(db, 'productos', id), datos, { merge: true })
      return { ...producto }
    }
    const ref = await addDoc(collection(db, 'productos'), producto)
    return { ...producto, id: ref.id }
  }
  const productos = leerLocal()
  if (producto.id) {
    const idx = productos.findIndex((p) => p.id === producto.id)
    if (idx >= 0) productos[idx] = producto
    else productos.push(producto)
  } else {
    producto.id = `local-${Date.now()}`
    productos.push(producto)
  }
  guardarLocal(productos)
  return producto
}

export async function eliminarProducto(id) {
  if (isFirebaseConfigurado()) {
    const db = await obtenerFirestore()
    const { doc, deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'productos', id))
    return
  }
  const productos = leerLocal().filter((p) => p.id !== id)
  guardarLocal(productos)
}

export async function descontarStock(id, cantidad) {
  const producto = await obtenerProducto(id)
  if (!producto) return
  producto.stock = Math.max(0, (producto.stock ?? 0) - cantidad)
  await guardarProducto(producto)
}
