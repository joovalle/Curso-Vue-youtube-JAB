import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Perfil, Rol } from './types'

interface AuthCtx {
  cargando: boolean
  session: Session | null
  perfil: Perfil | null
  puedeEscribir: boolean
  esAdmin: boolean
  aviso: string | null
  salir: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargando, setCargando] = useState(true)
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setCargando(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) {
        setPerfil(null)
        setCargando(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    setCargando(true)
    supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(async ({ data }) => {
        if (!data || !data.activo) {
          setAviso(data ? 'Tu usuario está desactivado. Habla con el administrador.' : 'No se encontró tu perfil.')
          await supabase.auth.signOut()
        } else {
          setAviso(null)
          setPerfil(data as Perfil)
        }
        setCargando(false)
      })
  }, [userId])

  const rol: Rol | undefined = perfil?.rol
  const value: AuthCtx = {
    // mientras haya sesión sin perfil cargado seguimos "cargando" (evita saltos de redirección)
    cargando: cargando || (!!session && !perfil),
    session,
    perfil,
    aviso,
    puedeEscribir: rol === 'admin' || rol === 'tesorero',
    esAdmin: rol === 'admin',
    salir: async () => {
      await supabase.auth.signOut()
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
