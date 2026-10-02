import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { configurado } from './lib/supabase'
import Layout from './components/Layout'
import { Cargando } from './components/ui'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import Reportes from './pages/Reportes'
import Categorias from './pages/Categorias'
import Usuarios from './pages/Usuarios'

function Protegido({ soloAdmin = false, children }: { soloAdmin?: boolean; children: React.ReactNode }) {
  const { cargando, session, perfil, esAdmin } = useAuth()
  if (cargando) return <Cargando />
  if (!session || !perfil) return <Navigate to="/login" replace />
  if (soloAdmin && !esAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function SinConfigurar() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-lg p-8">
        <h1 className="text-xl font-extrabold">Falta conectar Supabase</h1>
        <p className="mt-2 text-sm text-slate-600">
          Copia <code className="rounded bg-slate-100 px-1">.env.example</code> a <code className="rounded bg-slate-100 px-1">.env</code> y completa
          <b> VITE_SUPABASE_URL</b> y <b>VITE_SUPABASE_ANON_KEY</b>. Luego reinicia <code className="rounded bg-slate-100 px-1">npm run dev</code>.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  if (!configurado) return <SinConfigurar />
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Protegido><Layout /></Protegido>}>
            <Route index element={<Dashboard />} />
            <Route path="movimientos" element={<Movimientos />} />
            <Route path="reportes" element={<Reportes />} />
            <Route path="categorias" element={<Protegido soloAdmin><Categorias /></Protegido>} />
            <Route path="usuarios" element={<Protegido soloAdmin><Usuarios /></Protegido>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
