import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { ErrorMsg } from '../components/ui'

export default function Login() {
  const { session, perfil, aviso } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ver, setVer] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  if (session && perfil) return <Navigate to="/" replace />

  const entrar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setCargando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setError('Correo o contraseña incorrectos')
    setCargando(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-gradient p-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
        <img src="/logo.png" alt="Templo Cristiano Renacer · Patricio Lynch" className="mx-auto h-44 w-auto sm:h-52" />
        <h1 className="mt-2 text-center text-xl font-extrabold tracking-tight">Tesorería</h1>
        <p className="mb-6 text-center text-sm text-slate-500">Ingresa para registrar y consultar los movimientos</p>

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label className="label">Correo</label>
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <div className="relative">
              <input
                className="input pr-11" type={ver ? 'text' : 'password'} autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
              <button type="button" onClick={() => setVer(!ver)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Mostrar contraseña">
                {ver ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <ErrorMsg texto={error ?? aviso} />
          <button className="btn-primary w-full !py-3" disabled={cargando}>{cargando ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </div>
    </div>
  )
}
