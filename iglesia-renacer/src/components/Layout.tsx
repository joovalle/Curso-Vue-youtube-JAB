import { NavLink, Outlet } from 'react-router-dom'
import { BarChart3, FolderTree, LayoutDashboard, LogOut, ReceiptText, Users } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { ROLES } from '../lib/types'

export default function Layout() {
  const { perfil, esAdmin, salir } = useAuth()

  const items = [
    { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
    { to: '/movimientos', label: 'Movimientos', icon: ReceiptText },
    { to: '/reportes', label: 'Reportes', icon: BarChart3 },
    ...(esAdmin
      ? [
          { to: '/categorias', label: 'Categorías', icon: FolderTree },
          { to: '/usuarios', label: 'Usuarios', icon: Users },
        ]
      : []),
  ]

  const clase = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-brand-gradient text-white shadow-md shadow-brand-violet/25' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen lg:pl-72">
      {/* Barra lateral (escritorio) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-slate-200/70 bg-white p-5 lg:flex">
        <div className="flex items-center gap-3 px-1 pb-6">
          <img src="/emblema.png" alt="" className="h-14 w-auto" />
          <div className="leading-tight">
            <p className="text-[11px] font-medium uppercase tracking-[.2em] text-slate-500">Templo Cristiano</p>
            <p className="text-xl font-extrabold tracking-tight">RENACER</p>
            <p className="text-[10px] uppercase tracking-[.3em] text-slate-400">Patricio Lynch</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={clase}>
              <Icon size={19} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-2xl bg-slate-50 p-3.5">
          <p className="truncate text-sm font-bold">{perfil?.nombre}</p>
          <p className="truncate text-xs text-slate-500">{perfil?.email}</p>
          <p className="mt-1 inline-block rounded-full bg-brand-violet/10 px-2 py-0.5 text-[11px] font-bold text-brand-violet">
            {perfil && ROLES[perfil.rol].etiqueta}
          </p>
          <button onClick={salir} className="btn-ghost mt-3 w-full !py-2">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Barra superior (móvil) */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200/70 bg-white/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2.5">
          <img src="/emblema.png" alt="" className="h-9 w-auto" />
          <p className="text-base font-extrabold tracking-tight">RENACER</p>
        </div>
        <button onClick={salir} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar sesión">
          <LogOut size={20} />
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pb-10 lg:pt-8">
        <Outlet />
      </main>

      {/* Navegación inferior (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200/70 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),.5rem)] pt-1.5 backdrop-blur lg:hidden">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10.5px] font-semibold ${
                isActive ? 'text-brand-violet' : 'text-slate-500'
              }`
            }
          >
            <Icon size={21} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
