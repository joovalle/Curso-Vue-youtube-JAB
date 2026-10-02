import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { KeyRound, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { ROLES, type Perfil, type Rol } from '../lib/types'
import { Campo, Cargando, ErrorMsg, Modal, Titulo, mensajeError } from '../components/ui'

async function llamar(cuerpo: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('usuarios', { body: cuerpo })
  if (error) {
    // La función devuelve { error } con el motivo; lo extraemos del cuerpo de la respuesta
    const resp = (error as { context?: Response }).context
    const detalle = resp ? await resp.json().catch(() => null) : null
    throw new Error(detalle?.error ?? error.message)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export default function Usuarios() {
  const { perfil: yo } = useAuth()
  const [lista, setLista] = useState<Perfil[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [clave, setClave] = useState<Perfil | null>(null)

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('perfiles').select('*').order('creado_en')
    if (error) setError(mensajeError(error))
    else setLista(data as Perfil[])
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const actualizar = async (id: string, cambios: Partial<Pick<Perfil, 'rol' | 'activo'>>) => {
    setError(null)
    const { error } = await supabase.from('perfiles').update(cambios).eq('id', id)
    if (error) setError(mensajeError(error))
    cargar()
  }

  return (
    <>
      <Titulo titulo="Usuarios" sub="Quién puede entrar al sistema y qué puede hacer">
        <button className="btn-primary" onClick={() => setNuevo(true)}><UserPlus size={18} /> Nuevo usuario</button>
      </Titulo>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(Object.keys(ROLES) as Rol[]).map((r) => (
          <div key={r} className="card p-4">
            <p className="text-sm font-extrabold text-brand-violet">{ROLES[r].etiqueta}</p>
            <p className="mt-0.5 text-xs text-slate-500">{ROLES[r].descripcion}</p>
          </div>
        ))}
      </div>

      <ErrorMsg texto={error} />
      <div className="card mt-4 overflow-hidden">
        {!lista ? <Cargando /> : (
          <ul className="divide-y divide-slate-100">
            {lista.map((u) => {
              const esYo = u.id === yo?.id
              return (
                <li key={u.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 ${u.activo ? '' : 'bg-slate-50 opacity-70'}`}>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{u.nombre} {esYo && <span className="ml-1 text-xs font-semibold text-slate-400">(tú)</span>}</p>
                    <p className="truncate text-sm text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select className="input !w-auto !py-2" value={u.rol} disabled={esYo}
                      onChange={(e) => actualizar(u.id, { rol: e.target.value as Rol })}>
                      {(Object.keys(ROLES) as Rol[]).map((r) => <option key={r} value={r}>{ROLES[r].etiqueta}</option>)}
                    </select>
                    <button className="btn-ghost !py-2" title="Cambiar contraseña" onClick={() => setClave(u)}><KeyRound size={16} /></button>
                    {!esYo && (
                      <button className={`btn-ghost !py-2 ${u.activo ? '!text-rose-600' : '!text-emerald-600'}`} onClick={() => actualizar(u.id, { activo: !u.activo })}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <NuevoUsuario abierto={nuevo} onCerrar={() => setNuevo(false)} onCreado={cargar} />
      <CambiarClave usuario={clave} onCerrar={() => setClave(null)} />
    </>
  )
}

function NuevoUsuario({ abierto, onCerrar, onCreado }: { abierto: boolean; onCerrar: () => void; onCreado: () => void }) {
  const [f, setF] = useState({ nombre: '', email: '', password: '', rol: 'tesorero' as Rol })
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => { if (abierto) { setF({ nombre: '', email: '', password: '', rol: 'tesorero' }); setError(null) } }, [abierto])

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      await llamar({ accion: 'crear', ...f })
      onCreado()
      onCerrar()
    } catch (err) { setError(mensajeError(err)) }
    setCargando(false)
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Nuevo usuario">
      <form onSubmit={enviar} className="space-y-4">
        <Campo label="Nombre completo"><input className="input" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required /></Campo>
        <Campo label="Correo"><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Campo>
        <Campo label="Contraseña inicial (mín. 8 caracteres)">
          <input className="input" type="text" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required autoComplete="off" />
        </Campo>
        <Campo label="Rol">
          <select className="input" value={f.rol} onChange={(e) => setF({ ...f, rol: e.target.value as Rol })}>
            {(Object.keys(ROLES) as Rol[]).map((r) => <option key={r} value={r}>{ROLES[r].etiqueta} — {ROLES[r].descripcion}</option>)}
          </select>
        </Campo>
        <ErrorMsg texto={error} />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCerrar}>Cancelar</button>
          <button className="btn-primary" disabled={cargando}>{cargando ? 'Creando…' : 'Crear usuario'}</button>
        </div>
      </form>
    </Modal>
  )
}

function CambiarClave({ usuario, onCerrar }: { usuario: Perfil | null; onCerrar: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [cargando, setCargando] = useState(false)

  useEffect(() => { setPassword(''); setError(null); setOk(false) }, [usuario])

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      await llamar({ accion: 'cambiar_password', id: usuario!.id, password })
      setOk(true)
    } catch (err) { setError(mensajeError(err)) }
    setCargando(false)
  }

  return (
    <Modal abierto={!!usuario} onCerrar={onCerrar} titulo={`Contraseña de ${usuario?.nombre ?? ''}`}>
      {ok ? (
        <>
          <p className="rounded-xl bg-emerald-50 px-3.5 py-3 text-sm text-emerald-700">Contraseña actualizada. Compártela con la persona de forma segura.</p>
          <div className="mt-4 flex justify-end"><button className="btn-primary" onClick={onCerrar}>Listo</button></div>
        </>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          <Campo label="Nueva contraseña (mín. 8 caracteres)">
            <input className="input" type="text" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="off" />
          </Campo>
          <ErrorMsg texto={error} />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={onCerrar}>Cancelar</button>
            <button className="btn-primary" disabled={cargando}>{cargando ? 'Guardando…' : 'Cambiar'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
