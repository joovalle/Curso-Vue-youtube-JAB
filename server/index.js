// Servidor backend mínimo, solo necesario para procesar pagos reales con
// Mercado Pago. La tienda (frontend) funciona igual sin este servidor,
// en "modo demo" (ver src/services/mercadopago.js).
//
// Uso local:
//   1. Copia .env.example a .env y agrega tu MP_ACCESS_TOKEN
//   2. npm run server
//   3. En el frontend, agrega VITE_API_URL=http://localhost:4000 a tu .env

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { crearPreferencia, mercadoPagoConfigurado } from './mercadopagoService.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mercadoPagoConfigurado: mercadoPagoConfigurado() })
})

app.post('/api/create-preference', async (req, res) => {
  try {
    const preferencia = await crearPreferencia(req.body)
    res.json(preferencia)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Servidor de pagos escuchando en http://localhost:${PORT}`)
  console.log(
    mercadoPagoConfigurado()
      ? 'Mercado Pago: credenciales detectadas.'
      : 'Mercado Pago: SIN credenciales (agrega MP_ACCESS_TOKEN en .env).'
  )
})
