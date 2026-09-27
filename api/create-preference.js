// Función serverless (formato Vercel) equivalente a server/index.js,
// para desplegar el backend de pagos sin mantener un servidor propio.
import { crearPreferencia } from '../server/mercadopagoService.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' })
    return
  }
  try {
    const preferencia = await crearPreferencia(req.body)
    res.status(200).json(preferencia)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
