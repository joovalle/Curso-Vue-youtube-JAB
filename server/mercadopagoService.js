// Lógica compartida para crear una preferencia de pago de Mercado Pago.
// La usan tanto server/index.js (servidor Express, para hosting propio /
// Render / Railway) como api/create-preference.js (función serverless,
// para desplegar en Vercel).
//
// IMPORTANTE: MP_ACCESS_TOKEN debe ser el "Access Token" (privado) de tu
// cuenta de Mercado Pago Developers. Nunca se expone al navegador: solo
// vive en el servidor / variables de entorno.

import { MercadoPagoConfig, Preference } from 'mercadopago'

export function mercadoPagoConfigurado() {
  return Boolean(process.env.MP_ACCESS_TOKEN)
}

export async function crearPreferencia(orden) {
  const accessToken = process.env.MP_ACCESS_TOKEN
  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN no está configurado en el servidor')
  }

  const client = new MercadoPagoConfig({ accessToken })
  const preference = new Preference(client)

  const items = (orden.items || []).map((item) => ({
    title: `${item.marca ?? ''} ${item.nombre ?? ''} ${item.medida ?? ''}`.trim(),
    quantity: item.cantidad,
    unit_price: item.precio,
    currency_id: 'CLP',
  }))

  if (orden.costoEnvio > 0) {
    items.push({
      title: 'Costo de envío',
      quantity: 1,
      unit_price: orden.costoEnvio,
      currency_id: 'CLP',
    })
  }

  const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173'

  const resultado = await preference.create({
    body: {
      items,
      payer: orden.cliente
        ? {
            name: orden.cliente.nombre,
            email: orden.cliente.correo,
            phone: { number: orden.cliente.telefono || '' },
          }
        : undefined,
      back_urls: {
        success: `${baseUrl}/checkout/exito`,
        failure: `${baseUrl}/checkout/error`,
        pending: `${baseUrl}/checkout/exito`,
      },
      auto_return: 'approved',
      metadata: { entrega: orden.entrega },
    },
  })

  return {
    id: resultado.id,
    init_point: resultado.init_point,
    sandbox_init_point: resultado.sandbox_init_point,
  }
}
