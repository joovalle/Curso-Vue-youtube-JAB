import { useEffect, useState, type FormEvent } from 'react'
import { FileText, Paperclip, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { hoy } from '../lib/format'
import type { Categoria, Movimiento, Tipo } from '../lib/types'
import { Campo, ErrorMsg, Modal, mensajeError } from './ui'

interface Props {
  abierto: boolean
  onCerrar: () => void
  onGuardado: () => void
  categorias: Categoria[]
  editar: Movimiento | null
}

export default function MovimientoModal({ abierto, onCerrar, onGuardado, categorias, editar }: Props) {
  const [tipo, setTipo] = useState<Tipo>('ingreso')
  const [fecha, setFecha] = useState(hoy())
  const [monto, setMonto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [quitarComprobante, setQuitarComprobante] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!abierto) return
    setError(null)
    setArchivo(null)
    setQuitarComprobante(false)
    if (editar) {
      setTipo(editar.tipo)
      setFecha(editar.fecha)
      setMonto(String(editar.monto))
      setCategoriaId(editar.categoria_id)
      setDescripcion(editar.descripcion)
    } else {
      setTipo('ingreso')
      setFecha(hoy())
      setMonto('')
      setCategoriaId('')
      setDescripcion('')
    }
  }, [abierto, editar])

  // Categorías del tipo elegido (más la actual si se está editando una desactivada)
  const opciones = categorias.filter((c) => c.tipo === tipo && (c.activa || c.id === editar?.categoria_id))

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const valor = Number(monto.replace(',', '.'))
    if (!(valor > 0)) return setError('Ingresa un monto mayor a 0')
    if (!categoriaId) return setError('Selecciona una categoría')
    if (archivo && archivo.size > 5 * 1024 * 1024) return setError('El comprobante no puede superar 5 MB')

    setGuardando(true)
    try {
      let comprobante_path = editar?.comprobante_path ?? null
      const anterior = comprobante_path

      if (archivo) {
        const ext = archivo.name.split('.').pop()?.toLowerCase() || 'bin'
        const ruta = `${fecha.slice(0, 4)}/${crypto.randomUUID()}.${ext}`
        const { error: eUp } = await supabase.storage.from('comprobantes').upload(ruta, archivo, { contentType: archivo.type })
        if (eUp) throw eUp
        comprobante_path = ruta
      } else if (quitarComprobante) {
        comprobante_path = null
      }

      const fila = { fecha, monto: valor, categoria_id: categoriaId, descripcion: descripcion.trim(), comprobante_path }
      const { error: eDb } = editar
        ? await supabase.from('movimientos').update(fila).eq('id', editar.id)
        : await supabase.from('movimientos').insert({ ...fila, tipo })
      if (eDb) {
        if (archivo && comprobante_path) await supabase.storage.from('comprobantes').remove([comprobante_path])
        throw eDb
      }
      if (anterior && anterior !== comprobante_path) await supabase.storage.from('comprobantes').remove([anterior])
      onGuardado()
      onCerrar()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const tieneComprobante = !!editar?.comprobante_path && !quitarComprobante

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={editar ? 'Editar movimiento' : 'Nuevo movimiento'}>
      <form onSubmit={guardar} className="space-y-4">
        {!editar && (
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
            {(['ingreso', 'gasto'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => { setTipo(t); setCategoriaId('') }}
                className={`rounded-xl py-2.5 text-sm font-bold transition ${
                  tipo === t
                    ? t === 'ingreso' ? 'bg-emerald-600 text-white shadow' : 'bg-rose-600 text-white shadow'
                    : 'text-slate-500'
                }`}
              >
                {t === 'ingreso' ? 'Ingreso' : 'Gasto'}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Campo label="Fecha">
            <input type="date" className="input" value={fecha} max="2100-12-31" onChange={(e) => setFecha(e.target.value)} required />
          </Campo>
          <Campo label="Monto">
            <input
              className="input" inputMode="decimal" placeholder="0" value={monto}
              onChange={(e) => setMonto(e.target.value)} required
            />
          </Campo>
        </div>

        <Campo label="Categoría">
          <select className="input" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
            <option value="">Seleccionar…</option>
            {opciones.map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.activa ? '' : ' (inactiva)'}</option>)}
          </select>
        </Campo>

        <Campo label="Descripción">
          <textarea
            className="input min-h-[80px] resize-y" placeholder="Detalle del movimiento (opcional)"
            value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={500}
          />
        </Campo>

        <Campo label="Comprobante (opcional)">
          {tieneComprobante && !archivo && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
              <span className="flex items-center gap-2 text-slate-600"><FileText size={16} /> Ya tiene un comprobante adjunto</span>
              <button type="button" onClick={() => setQuitarComprobante(true)} className="flex items-center gap-1 text-xs font-semibold text-rose-600">
                <Trash2 size={14} /> Quitar
              </button>
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 px-3.5 py-3 text-sm text-slate-500 transition hover:border-brand-violet hover:bg-brand-violet/5">
            <Paperclip size={18} />
            <span className="truncate">{archivo ? archivo.name : 'Adjuntar foto o PDF (máx. 5 MB)'}</span>
            <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
          </label>
        </Campo>

        <ErrorMsg texto={error} />
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onCerrar}>Cancelar</button>
          <button className="btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  )
}
