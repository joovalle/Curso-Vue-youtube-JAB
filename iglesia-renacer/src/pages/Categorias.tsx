import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { listarCategorias } from '../lib/datos'
import type { Categoria, Tipo } from '../lib/types'
import { Cargando, ErrorMsg, Modal, Titulo, mensajeError } from '../components/ui'

export default function Categorias() {
  const [lista, setLista] = useState<Categoria[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<{ id?: string; nombre: string; tipo: Tipo } | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => listarCategorias().then(setLista).catch((e) => setError(mensajeError(e))), [])
  useEffect(() => { cargar() }, [cargar])

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (!modal) return
    setGuardando(true)
    setError(null)
    const nombre = modal.nombre.trim()
    const { error } = modal.id
      ? await supabase.from('categorias').update({ nombre }).eq('id', modal.id)
      : await supabase.from('categorias').insert({ nombre, tipo: modal.tipo })
    setGuardando(false)
    if (error) return setError(error.code === '23505' ? 'Ya existe una categoría con ese nombre' : mensajeError(error))
    setModal(null)
    cargar()
  }

  const alternar = async (c: Categoria) => {
    const { error } = await supabase.from('categorias').update({ activa: !c.activa }).eq('id', c.id)
    if (error) setError(mensajeError(error))
    cargar()
  }

  const Columna = ({ tipo, titulo, color }: { tipo: Tipo; titulo: string; color: string }) => (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`font-extrabold ${color}`}>{titulo}</h2>
        <button className="btn-ghost !py-1.5" onClick={() => { setError(null); setModal({ nombre: '', tipo }) }}><Plus size={16} /> Agregar</button>
      </div>
      <ul className="divide-y divide-slate-100">
        {lista!.filter((c) => c.tipo === tipo).map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className={`truncate text-sm font-medium ${c.activa ? '' : 'text-slate-400 line-through'}`}>{c.nombre}</span>
            <div className="flex shrink-0 gap-3 text-xs font-semibold">
              <button className="text-brand-violet hover:underline" onClick={() => { setError(null); setModal({ id: c.id, nombre: c.nombre, tipo: c.tipo }) }}>Renombrar</button>
              <button className="text-slate-500 hover:underline" onClick={() => alternar(c)}>{c.activa ? 'Desactivar' : 'Activar'}</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )

  return (
    <>
      <Titulo titulo="Categorías" sub="Las categorías desactivadas no aparecen al registrar, pero se conserva su historial" />
      {!modal && <ErrorMsg texto={error} />}
      {!lista ? <Cargando /> : (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <Columna tipo="ingreso" titulo="Categorías de ingreso" color="text-emerald-600" />
          <Columna tipo="gasto" titulo="Categorías de gasto" color="text-rose-600" />
        </div>
      )}
      <Modal abierto={!!modal} onCerrar={() => setModal(null)} titulo={modal?.id ? 'Renombrar categoría' : `Nueva categoría de ${modal?.tipo}`}>
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="label">Nombre</label>
            <input className="input" autoFocus value={modal?.nombre ?? ''} maxLength={60} required onChange={(e) => setModal({ ...modal!, nombre: e.target.value })} />
          </div>
          <ErrorMsg texto={error} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
            <button className="btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </>
  )
}
