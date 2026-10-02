// Edge Function: administración de usuarios (solo para rol "admin").
// Despliegue:  supabase functions deploy usuarios
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY ya vienen inyectadas por Supabase.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const ROLES = ['admin', 'tesorero', 'consulta']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const authHeader = req.headers.get('Authorization') ?? ''

    // 1) Quién llama
    const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: u } = await caller.auth.getUser()
    if (!u.user) return json({ error: 'No autenticado' }, 401)

    // 2) Debe ser administrador activo
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: perfil } = await admin.from('perfiles').select('rol, activo').eq('id', u.user.id).single()
    if (!perfil || perfil.rol !== 'admin' || !perfil.activo) return json({ error: 'Solo un administrador puede hacer esto' }, 403)

    const { accion, ...p } = await req.json()

    if (accion === 'crear') {
      const email = String(p.email ?? '').trim().toLowerCase()
      const nombre = String(p.nombre ?? '').trim()
      if (!email || !nombre) return json({ error: 'Nombre y correo son obligatorios' }, 400)
      if (String(p.password ?? '').length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)
      if (!ROLES.includes(p.rol)) return json({ error: 'Rol inválido' }, 400)

      const { data, error } = await admin.auth.admin.createUser({
        email, password: p.password, email_confirm: true, user_metadata: { nombre },
      })
      if (error) return json({ error: error.message }, 400)
      // El trigger crea el perfil como "consulta"; aquí se ajusta el rol elegido
      const { error: e2 } = await admin.from('perfiles').update({ rol: p.rol, nombre }).eq('id', data.user.id)
      if (e2) return json({ error: e2.message }, 400)
      return json({ ok: true, id: data.user.id })
    }

    if (accion === 'cambiar_password') {
      if (String(p.password ?? '').length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)
      const { error } = await admin.auth.admin.updateUserById(p.id, { password: p.password })
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    return json({ error: 'Acción desconocida' }, 400)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})
