import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react'
import { movimientosEntre, porCategoria, resumir, saldoAnterior } from '../lib/datos'
import { dinero, fechaCorta, MESES, rangoMes } from '../lib/format'
import type { Movimiento } from '../lib/types'
import { Cargando, ErrorMsg, Titulo, Vacio, mensajeError } from '../components/ui'
import { useAuth } from '../lib/auth'

const Stat = ({ label, valor, icon: Icon, color }: { label: string; valor: number; icon: typeof Wallet; color: string }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <span className={`rounded-xl p-2 ${color}`}><Icon size={20} /></span>
    </div>
    <p className="mt-3 text-2xl font-extrabold tracking-tight lg:text-[28px]">{dinero(valor)}</p>
  </div>
)

export default function Dashboard() {
  const { perfil } = useAuth()
  const [datos, setDatos] = useState<{ meses: { etiqueta: string; ingresos: number; gastos: number }[]; mes: Movimiento[]; acumulado: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hoyD = new Date()
    const anio = hoyD.getFullYear()
    const mes = hoyD.getMonth() + 1
    ;(async () => {
      try {
        // Últimos 6 meses
        const inicio = new Date(anio, mes - 6, 1)
        const desde = rangoMes(inicio.getFullYear(), inicio.getMonth() + 1).desde
        const todos = await movimientosEntre(desde, rangoMes(anio, mes).hasta)
        const meses = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(anio, mes - 6 + i, 1)
          const r = rangoMes(d.getFullYear(), d.getMonth() + 1)
          const s = resumir(todos.filter((m) => m.fecha >= r.desde && m.fecha <= r.hasta))
          return { etiqueta: MESES[d.getMonth()].slice(0, 3), ingresos: s.ingresos, gastos: s.gastos }
        })
        const r = rangoMes(anio, mes)
        const acumulado = await saldoAnterior('2100-01-01')
        setDatos({ meses, mes: todos.filter((m) => m.fecha >= r.desde && m.fecha <= r.hasta), acumulado })
      } catch (e) {
        setError(mensajeError(e))
      }
    })()
  }, [])

  const hoyD = new Date()
  if (error) return <ErrorMsg texto={error} />
  if (!datos) return <Cargando />

  const r = resumir(datos.mes)
  const max = Math.max(1, ...datos.meses.flatMap((m) => [m.ingresos, m.gastos]))
  const recientes = [...datos.mes].reverse().slice(0, 6)
  const topGastos = porCategoria(datos.mes, 'gasto').slice(0, 5)

  return (
    <>
      <Titulo titulo={`Paz, ${perfil?.nombre.split(' ')[0] ?? ''} 👋`} sub={`Resumen de ${MESES[hoyD.getMonth()]} ${hoyD.getFullYear()}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Ingresos del mes" valor={r.ingresos} icon={ArrowUpCircle} color="bg-emerald-50 text-emerald-600" />
        <Stat label="Gastos del mes" valor={r.gastos} icon={ArrowDownCircle} color="bg-rose-50 text-rose-600" />
        <Stat label="Resultado del mes" valor={r.saldo} icon={Wallet} color="bg-brand-blue/10 text-brand-blue" />
        <div className="card bg-brand-gradient p-5 text-white !border-0">
          <p className="text-sm font-semibold text-white/80">Saldo total en caja</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight lg:text-[28px]">{dinero(datos.acumulado)}</p>
          <p className="mt-1 text-xs text-white/70">Acumulado de todos los períodos</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-extrabold">Últimos 6 meses</h2>
            <div className="flex gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Ingresos</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Gastos</span>
            </div>
          </div>
          <div className="flex h-56 items-end justify-between gap-2 sm:gap-4">
            {datos.meses.map((m, i) => (
              <div key={i} className="flex h-full flex-1 flex-col justify-end">
                <div className="flex flex-1 items-end justify-center gap-1">
                  <div title={dinero(m.ingresos)} className="w-full max-w-[26px] rounded-t-lg bg-emerald-500 transition-all" style={{ height: `${(m.ingresos / max) * 100}%`, minHeight: m.ingresos ? 4 : 0 }} />
                  <div title={dinero(m.gastos)} className="w-full max-w-[26px] rounded-t-lg bg-rose-500 transition-all" style={{ height: `${(m.gastos / max) * 100}%`, minHeight: m.gastos ? 4 : 0 }} />
                </div>
                <p className="mt-2 text-center text-xs font-semibold text-slate-500">{m.etiqueta}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-extrabold">Mayores gastos del mes</h2>
          {topGastos.length === 0 ? <Vacio texto="Aún no hay gastos este mes" /> : (
            <ul className="space-y-3.5">
              {topGastos.map((c) => (
                <li key={c.nombre}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{c.nombre}</span>
                    <span className="shrink-0 font-bold">{dinero(c.total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(c.total / topGastos[0].total) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold">Movimientos recientes</h2>
          <Link to="/movimientos" className="text-sm font-semibold text-brand-violet hover:underline">Ver todos</Link>
        </div>
        {recientes.length === 0 ? <Vacio texto="Aún no hay movimientos este mes" /> : (
          <ul className="divide-y divide-slate-100">
            {recientes.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{m.categorias?.nombre}</p>
                  <p className="truncate text-xs text-slate-500">{fechaCorta(m.fecha)}{m.descripcion && ` · ${m.descripcion}`}</p>
                </div>
                <p className={`shrink-0 text-sm font-extrabold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {m.tipo === 'ingreso' ? '+' : '−'}{dinero(Number(m.monto))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
