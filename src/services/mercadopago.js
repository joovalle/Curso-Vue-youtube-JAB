// Cliente para iniciar el pago con Mercado Pago (Checkout Pro).
// Si existe VITE_API_URL configurado, se llama al backend real (server/ o api/)
// que crea la "preferencia" de pago con las credenciales de Mercado Pago.
// Si no hay backend disponible (por ejemplo en un hosting 100% estático como
// GitHub Pages sin funciones), la compra se completa en "modo demo" para
// poder probar todo el flujo sin cobrar de verdad.

const API_URL = import.meta.env.VITE_API_URL || ''

export function guardarOrdenDemo(orden) {
  try {
    const claves = JSON.parse(localStorage.getItem('rn_orders') || '[]')
    claves.push(orden)
    localStorage.setItem('rn_orders', JSON.stringify(claves))
  } catch (e) {
    /* ignorar */
  }
}

export async function iniciarPago(orden) {
  if (API_URL) {
    try {
      const resp = await fetch(`${API_URL}/api/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orden),
      })
      if (!resp.ok) throw new Error('Backend de pago no disponible')
      const data = await resp.json()
      if (data.init_point) {
        window.location.href = data.init_point
        return { modo: 'mercadopago' }
      }
      throw new Error('Respuesta inválida del backend de pago')
    } catch (err) {
      console.warn('Fallo Mercado Pago, usando modo demo:', err.message)
    }
  }

  // Modo demo: no hay backend de pago configurado todavía.
  guardarOrdenDemo(orden)
  return { modo: 'demo' }
}
