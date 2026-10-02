const MONEDA = (import.meta.env.VITE_MONEDA as string | undefined) || 'CLP'

const LOCALES: Record<string, string> = {
  CLP: 'es-CL', COP: 'es-CO', MXN: 'es-MX', PEN: 'es-PE', ARS: 'es-AR', USD: 'es-US', HNL: 'es-HN', GTQ: 'es-GT',
}

const fmtMoneda = new Intl.NumberFormat(LOCALES[MONEDA] ?? 'es', {
  style: 'currency',
  currency: MONEDA,
  currencyDisplay: 'narrowSymbol',
})

export const dinero = (n: number) => fmtMoneda.format(n)

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** Fecha local de hoy en formato YYYY-MM-DD (sin saltos por zona horaria). */
export const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 'YYYY-MM-DD' -> '05 oct 2026' */
export const fechaCorta = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${pad(d)} ${MESES[m - 1].slice(0, 3).toLowerCase()} ${y}`
}

/** Primer y último día (inclusive) de un mes. mes: 1-12 */
export const rangoMes = (anio: number, mes: number) => {
  const ultimo = new Date(anio, mes, 0).getDate()
  return { desde: `${anio}-${pad(mes)}-01`, hasta: `${anio}-${pad(mes)}-${pad(ultimo)}` }
}

export const rangoAnio = (anio: number) => ({ desde: `${anio}-01-01`, hasta: `${anio}-12-31` })
