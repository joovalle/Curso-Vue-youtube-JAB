import { useCallback, useEffect, useState } from 'react'
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { listarCategorias, resumir, urlComprobante } from '../lib/datos'
import { dinero, fechaCorta, MESES, rangoMes } from '../lib/format'
import type { Categoria, Movimiento } from '../lib/types'
import { useAuth } from '../lib/auth'
import MovimientoModal from '../components/MovimientoModal'
import { Cargando, ErrorMsg, Modal, Titulo, Vacio, mensajeError } from '../components/ui'

const PAGINA = 25

export default function Movimientos() {
  const { puedeEscribir, esAdmin } = useAuth()
  const hoyD = new Date()
  const [anio, setAnio] = useState(hoyD.getFullYear())
  const [mes, setMes] = useState(hoyD.getMonth() + 1)
  const [tipo, setTipo] = useState<'' | 'ingreso' | 'gasto'>('')
  const [categoria, setCategoria] = useState('')
  const [pagina, setPagina] = useState(0)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [movs, setMovs] = useState<Movimiento[] | null>(null)
  const [total, setTotal] = useState(0)
  const [sumas, setSumas] = useState({ ingresos: 0, gastos: 0, saldo: 0 })
  const [error, setError] = useState<string | null>(null)

  const [modal, setModal] = useState(false)
  const [editar, setEditar] = useState<Movimiento | null>(null)
  const [borrar, setBorrar] = useState<Movimiento | null>(null)
  const [borrando, setBorrando] = useState(false)

  useEffect(() => { listarCategorias().then(setCategorias).catch((e) => setError(mensajeError(e))) }, [])

  const cargar = useCallback(async () => {
    setError(null)
    const { desde, hasta } = rangoMes(anio, mes)
    let lista = supabase
      .from('movimientos')
      .select('*, categorias(nombre), perfiles(nombre)', { count: 'exact' })
      .gte('fecha', desde)
      .lte('fecha', hasta)
    // Totales del filtro completo (no solo de la página visible)
    let totales = supabase.from('movimientos').select('tipo, monto').gte('fecha', desde).lte('fecha', hasta)
    if (tipo) { lista = lista.eq('tipo', tipo); totales = totales.eq('tipo', tipo) }
    if (categoria) { lista = lista.eq('categoria_id', categoria); totales = totales.eq('categoria_id', categoria) }

    const { data, count, error: e1 } = await lista
      .order('fecha', { ascending: false })
      .order('creado_en', { ascending: false })
      .range(pagina * PAGINA, pagina * PAGINA + PAGINA - 1)
    if (e1) return setError(mensajeError(e1))
    const { data: todos, error: e2 } = await totales
    if (e2) return setError(mensajeError(e2))
    setMovs(data as unknown as Movimiento[])
    setTotal(count ?? 0)
    setSumas(resumir((todos ?? []) as unknown as Movimiento[]))
  }, [anio, mes, tipo, categoria, pagina])

  useEffect(() => { cargar() }, [cargar])

  const abrirComprobante = async (path: string) => {
    try { window.open(await urlComprobante(path), '_blank', 'noopener') } catch (e) { setError(mensajeError(e)) }
  }

  const confirmarBorrado = async () => {
    if (!borrar) return
    setBorrando(true)
    const { error: e } = await supabase.from('movimientos').delete().eq('id', borrar.id)
    if (e) setError(mensajeError(e))
    else if (borrar.comprobante_path) await supabase.storage.from('comprobantes').remove([borrar.comprobante_path])
    setBorrando(false)
    setBorrar(null)
    cargar()
  }

  const cambiar = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPagina(0) }
  const paginas = Math.max(1, Math.ceil(total / PAGINA))
  const anios = Array.from({ length: 8 }, (_, i) => hoyD.getFullYear() - 5 + i)

  return (
    <>
      <Titulo titulo="Movimientos" sub="Ingresos y gastos registrados">
        {puedeEscribir && (
          <button className="btn-primary" onClick={() => { setEditar(null); setModal(true) }}><Plus size={18} /> Nuevo</button>
        )}
      </Titulo>

      <div className="card mb-4 grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
        <div>
          <label className="label">Mes</label>
          <select className="input" value={mes} onChange={(e) => cambiar(setMes)(Number(e.target.value))}>
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Año</label>
          <select className="input" value={anio} onChange={(e) => cambiar(setAnio)(Number(e.target.value))}>
            {anios.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={tipo} onChange={(e) => { setCategoria(''); cambiar(setTipo)(e.target.value as typeof tipo) }}>
            <option value="">Todos</option><option value="ingreso">Ingresos</option><option value="gasto">Gastos</option>
          </select>
        </div>
        <div>
          <label className="label">Categoría</label>
          <select className="input" value={categoria} onChange={(e) => cambiar(setCategoria)(e.target.value)}>
            <option value="">Todas</option>
            {categorias.filter((c) => !tipo || c.tipo === tipo).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="card p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">Ingresos</p><p className="font-extrabold text-emerald-600">{dinero(sumas.ingresos)}</p></div>
        <div className="card p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">Gastos</p><p className="font-extrabold text-rose-600">{dinero(sumas.gastos)}</p></div>
        <div className="card p-3"><p className="text-[11px] font-semibold uppercase text-slate-500">Resultado</p><p className="font-extrabold">{dinero(sumas.saldo)}</p></div>
      </div>

      <ErrorMsg texto={error} />

      <div className="card mt-4 overflow-hidden">
        {!movs ? <Cargando /> : movs.length === 0 ? <Vacio texto="No hay movimientos con estos filtros" /> : (
          <>
            {/* Tabla escritorio */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr><th className="th">Fecha</th><th className="th">Categoría</th><th className="th">Descripción</th><th className="th text-right">Monto</th><th className="th" /></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movs.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="td whitespace-nowrap text-slate-600">{fechaCorta(m.fecha)}</td>
                      <td className="td font-semibold">{m.categorias?.nombre}</td>
                      <td className="td max-w-xs truncate text-slate-600" title={m.descripcion}>{m.descripcion || '—'}</td>
                      <td className={`td whitespace-nowrap text-right font-extrabold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.tipo === 'ingreso' ? '+' : '−'}{dinero(Number(m.monto))}
                      </td>
                      <td className="td whitespace-nowrap text-right">
                        <Acciones m={m} puedeEscribir={puedeEscribir} esAdmin={esAdmin}
                          onVer={abrirComprobante} onEditar={() => { setEditar(m); setModal(true) }} onBorrar={() => setBorrar(m)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Tarjetas móvil */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {movs.map((m) => (
                <li key={m.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{m.categorias?.nombre}</p>
                      <p className="text-xs text-slate-500">{fechaCorta(m.fecha)}</p>
                    </div>
                    <p className={`shrink-0 font-extrabold ${m.tipo === 'ingreso' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.tipo === 'ingreso' ? '+' : '−'}{dinero(Number(m.monto))}
                    </p>
                  </div>
                  {m.descripcion && <p className="mt-1 text-sm text-slate-600">{m.descripcion}</p>}
                  <div className="mt-2 flex justify-end">
                    <Acciones m={m} puedeEscribir={puedeEscribir} esAdmin={esAdmin}
                      onVer={abrirComprobante} onEditar={() => { setEditar(m); setModal(true) }} onBorrar={() => setBorrar(m)} />
                  </div>
                </li>
              ))}
            </ul>
            {paginas > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
                <span className="text-slate-500">{total} movimientos · página {pagina + 1} de {paginas}</span>
                <div className="flex gap-2">
                  <button className="btn-ghost !py-1.5" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                  <button className="btn-ghost !py-1.5" disabled={pagina + 1 >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <MovimientoModal abierto={modal} onCerrar={() => setModal(false)} onGuardado={cargar} categorias={categorias} editar={editar} />

      <Modal abierto={!!borrar} onCerrar={() => setBorrar(null)} titulo="Eliminar movimiento">
        <p className="text-sm text-slate-600">
          ¿Eliminar <b>{borrar?.categorias?.nombre}</b> por <b>{borrar && dinero(Number(borrar.monto))}</b> del {borrar && fechaCorta(borrar.fecha)}? Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setBorrar(null)}>Cancelar</button>
          <button className="btn-danger" onClick={confirmarBorrado} disabled={borrando}>{borrando ? 'Eliminando…' : 'Eliminar'}</button>
        </div>
      </Modal>
    </>
  )
}

function Acciones({ m, puedeEscribir, esAdmin, onVer, onEditar, onBorrar }: {
  m: Movimiento; puedeEscribir: boolean; esAdmin: boolean
  onVer: (path: string) => void; onEditar: () => void; onBorrar: () => void
}) {
  const b = 'rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-ink'
  return (
    <div className="inline-flex items-center">
      {m.comprobante_path && (
        <button className={b} title="Ver comprobante" onClick={() => onVer(m.comprobante_path!)}><FileText size={17} /></button>
      )}
      {puedeEscribir && <button className={b} title="Editar" onClick={onEditar}><Pencil size={17} /></button>}
      {esAdmin && <button className={`${b} hover:!text-rose-600`} title="Eliminar" onClick={onBorrar}><Trash2 size={17} /></button>}
    </div>
  )
}
