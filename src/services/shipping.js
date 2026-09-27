import { zonaDeRegion } from '@/data/regionesComunas'

// Tarifas planas por zona geográfica. Al no contratar todavía una API real
// de courier (Chilexpress/Starken/etc.), se usa una tabla simple que el
// dueño de la tienda puede ajustar aquí mismo si cambian las tarifas.
const TARIFAS_POR_ZONA = {
  1: { costo: 3990, etaDias: '1-2 días hábiles' }, // Región Metropolitana
  2: { costo: 5990, etaDias: '2-4 días hábiles' }, // Zona central
  3: { costo: 7990, etaDias: '3-5 días hábiles' }, // Norte/sur medio
  4: { costo: 9990, etaDias: '5-8 días hábiles' }, // Zonas extremas
}

export function calcularEnvio({ metodo, regionId, subtotal }) {
  if (metodo === 'retiro') {
    return { costo: 0, etaDias: 'Disponible en 24 hrs', gratis: true }
  }
  const zona = zonaDeRegion(regionId)
  const tarifa = TARIFAS_POR_ZONA[zona] ?? TARIFAS_POR_ZONA[3]

  // Envío gratis sobre un monto mínimo de compra (umbral configurable).
  const UMBRAL_ENVIO_GRATIS = 250000
  if (subtotal >= UMBRAL_ENVIO_GRATIS) {
    return { costo: 0, etaDias: tarifa.etaDias, gratis: true }
  }
  return { costo: tarifa.costo, etaDias: tarifa.etaDias, gratis: false }
}
