import { useEffect, useState } from 'react'
import { FileSpreadsheet } from 'lucide-react'
import { movimientosEntre, porCategoria, porMes, resumir, saldoAnterior } from '../lib/datos'
import { dinero, MESES, rangoAnio, rangoMes } from '../lib/format'
import { exportarExcel } from '../lib/excel'
import type { Movimiento } from '../lib/types'
import { Cargando, ErrorMsg, Titulo, Vacio, mensajeError } from '../components/ui'

type Periodo = 'mensual' | 'anual'

function Desglose({ titulo, filas, total, color }: { titulo: string; filas: { nombre: string; total: number }[]; total: number; color: string }) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-extrabold">{titulo}</h2>
        <span className="font-extrabold">{dinero(total)}</span>
      </div>
      {filas.length === 0 ? <Vacio texto="Sin movimientos" /> : (
        <ul className="space-y-3">
          {filas.map((f) => (
            <li key={f.nombre}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span className="truncate">{f.nombre}</span>
                <span className="shrink-0 text-slate-500"><b className="text-ink">{dinero(f.total)}</b> · {total ? Math.round((f.total / total) * 100) : 0}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${total ? (f.total / total) * 100 : 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function Reportes() {
  const hoyD = new Date()
  const [periodo, setPeriodo] = useState<Periodo>('mensual')
  const [anio, setAnio] = useState(hoyD.getFullYear())
  const [mes, setMes] = useState(hoyD.getMonth() + 1)
  const [movs, setMovs] = useState<Movimiento[] | null>(null)
  const [inicial, setInicial] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    setMovs(null)
    setError(null)
    const { desde, hasta } = periodo === 'mensual' ? rangoMes(anio, mes) : rangoAnio(anio)
    Promise.all([movimientosEntre(desde, hasta), saldoAnterior(desde)])
      .then(([m, s]) => { setMovs(m); setInicial(s) })
      .catch((e) => setError(mensajeError(e)))
  }, [periodo, anio, mes])

  const nombrePeriodo = periodo === 'mensual' ? `${MESES[mes - 1]} ${anio}` : `Año ${anio}`

  const exportar = async () => {
    if (!movs) return
    setExportando(true)
    try {
      await exportarExcel({
        titulo: `Reporte ${periodo} — ${nombrePeriodo}`,
        archivo: `Renacer_${periodo === 'mensual' ? `${anio}-${String(mes).padStart(2, '0')}` : anio}`,
        movimientos: movs,
        saldoInicial: inicial,
        anual: periodo === 'anual',
      })
    } catch (e) { setError(mensajeError(e)) }
    setExportando(false)
  }

  const r = movs ? resumir(movs) : null
  const anios = Array.from({ length: 8 }, (_, i) => hoyD.getFullYear() - 5 + i)

  return (
    <>
      <Titulo titulo="Reportes" sub={nombrePeriodo}>
        <button className="btn-primary" onClick={exportar} disabled={!movs || exportando}>
          <FileSpreadsheet size={18} /> {exportando ? 'Generando…' : 'Exportar a Excel'}
        </button>
      </Titulo>

      <div className="card mb-6 flex flex-wrap items-end gap-3 p-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {(['mensual', 'anual'] as const).map((p) => (
            <button key={p} onClick={() => setPeriodo(p)}
              className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition ${periodo === p ? 'bg-white shadow text-brand-violet' : 'text-slate-500'}`}>{p}</button>
          ))}
        </div>
        {periodo === 'mensual' && (
          <div className="w-40">
            <label className="label">Mes</label>
            <select className="input" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          </div>
        )}
        <div className="w-28">
          <label className="label">Año</label>
          <select className="input" value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
            {anios.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <ErrorMsg texto={error} />
      {!movs || !r ? (!error && <Cargando />) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {[
              ['Saldo inicial', inicial, ''],
              ['Ingresos', r.ingresos, 'text-emerald-600'],
              ['Gastos', r.gastos, 'text-rose-600'],
              ['Resultado', r.saldo, r.saldo < 0 ? 'text-rose-600' : ''],
              ['Saldo final', inicial + r.saldo, 'text-brand-violet'],
            ].map(([k, v, c]) => (
              <div key={k as string} className="card p-4 last:col-span-2 lg:last:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</p>
                <p className={`mt-1.5 text-xl font-extrabold ${c}`}>{dinero(v as number)}</p>
              </div>
            ))}
          </div>

          {periodo === 'anual' && (
            <section className="card mt-6 overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr><th className="th">Mes</th><th className="th text-right">Ingresos</th><th className="th text-right">Gastos</th><th className="th text-right">Resultado</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {porMes(movs).map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="td font-semibold">{MESES[i]}</td>
                      <td className="td text-right text-emerald-600">{dinero(m.ingresos)}</td>
                      <td className="td text-right text-rose-600">{dinero(m.gastos)}</td>
                      <td className={`td text-right font-bold ${m.ingresos - m.gastos < 0 ? 'text-rose-600' : ''}`}>{dinero(m.ingresos - m.gastos)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50/70 font-extrabold">
                  <tr><td className="td">Total</td><td className="td text-right">{dinero(r.ingresos)}</td><td className="td text-right">{dinero(r.gastos)}</td><td className="td text-right">{dinero(r.saldo)}</td></tr>
                </tfoot>
              </table>
            </section>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Desglose titulo="Ingresos por categoría" filas={porCategoria(movs, 'ingreso')} total={r.ingresos} color="bg-emerald-500" />
            <Desglose titulo="Gastos por categoría" filas={porCategoria(movs, 'gasto')} total={r.gastos} color="bg-rose-500" />
          </div>
        </>
      )}
    </>
  )
}
