import { supabase } from './supabase'
import type { Categoria, Movimiento } from './types'

const SELECT_MOV = '*, categorias(nombre), perfiles(nombre)'

/** Trae TODOS los movimientos de un rango (supera el límite de 1000 filas de Supabase). */
export async function movimientosEntre(desde: string, hasta: string): Promise<Movimiento[]> {
  const todos: Movimiento[] = []
  const paso = 1000
  for (let i = 0; ; i += paso) {
    const { data, error } = await supabase
      .from('movimientos')
      .select(SELECT_MOV)
      .gte('fecha', desde)
      .lte('fecha', hasta)
      .order('fecha', { ascending: true })
      .order('creado_en', { ascending: true })
      .range(i, i + paso - 1)
    if (error) throw error
    todos.push(...(data as unknown as Movimiento[]))
    if (!data || data.length < paso) break
  }
  return todos
}

export async function saldoAnterior(hasta: string): Promise<number> {
  const { data, error } = await supabase.rpc('saldo_anterior', { hasta })
  if (error) throw error
  return Number(data ?? 0)
}

export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre')
  if (error) throw error
  return data as Categoria[]
}

export async function urlComprobante(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('comprobantes').createSignedUrl(path, 300)
  if (error) throw error
  return data.signedUrl
}

export interface Resumen {
  ingresos: number
  gastos: number
  saldo: number
}

export function resumir(movs: Movimiento[]): Resumen {
  let ingresos = 0
  let gastos = 0
  for (const m of movs) {
    if (m.tipo === 'ingreso') ingresos += Number(m.monto)
    else gastos += Number(m.monto)
  }
  return { ingresos, gastos, saldo: ingresos - gastos }
}

export function porCategoria(movs: Movimiento[], tipo: 'ingreso' | 'gasto') {
  const mapa = new Map<string, number>()
  for (const m of movs) {
    if (m.tipo !== tipo) continue
    const n = m.categorias?.nombre ?? 'Sin categoría'
    mapa.set(n, (mapa.get(n) ?? 0) + Number(m.monto))
  }
  return [...mapa.entries()].map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total)
}

export function porMes(movs: Movimiento[]) {
  const meses = Array.from({ length: 12 }, () => ({ ingresos: 0, gastos: 0 }))
  for (const m of movs) {
    const i = Number(m.fecha.slice(5, 7)) - 1
    if (m.tipo === 'ingreso') meses[i].ingresos += Number(m.monto)
    else meses[i].gastos += Number(m.monto)
  }
  return meses
}
