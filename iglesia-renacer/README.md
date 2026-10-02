# Tesorería · Templo Cristiano Renacer

App web para registrar ingresos y gastos de la iglesia, con reportes mensuales/anuales y exportación a Excel.
Funciona en línea desde cualquier celular o computador.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS · Supabase (Postgres, Auth, Storage, Edge Functions)

## Roles

| Rol | Puede |
|---|---|
| **Administrador** | Todo: movimientos (incluye eliminar), categorías, usuarios |
| **Tesorero** | Registrar y editar movimientos, adjuntar comprobantes, ver y exportar reportes |
| **Consulta** | Solo ver movimientos y reportes y exportar a Excel |

Los permisos se aplican en la base de datos (RLS), no solo en pantalla.

## Puesta en marcha

### 1. Supabase
1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor** → pega y ejecuta todo `supabase/schema.sql` (tablas, permisos, bucket de comprobantes y categorías iniciales).
3. **Authentication → Providers → Email**: desactiva *"Allow new users to sign up"* (los usuarios los crea el administrador desde la app).
4. **Authentication → Users → Add user**: crea tu usuario. **El primer usuario queda como Administrador automáticamente.**
5. Despliega la función que permite crear usuarios desde la app (con la [CLI de Supabase](https://supabase.com/docs/guides/cli)):
   ```sh
   supabase login
   supabase link --project-ref TU-PROJECT-REF
   supabase functions deploy usuarios
   ```

### 2. Local
```sh
cp .env.example .env     # completa URL y anon key (Project Settings → API) y la moneda
npm install
npm run dev
```

### 3. Publicar en línea
Sube la carpeta `iglesia-renacer` a **Vercel**, **Netlify** o **Cloudflare Pages** (gratis):
- Build command: `npm run build` · Output: `dist`
- Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_MONEDA`
- Agrega una regla de reescritura a `index.html` (SPA). En Netlify: archivo `public/_redirects` con `/* /index.html 200`.
- En Supabase → Authentication → URL Configuration, pon la URL pública como *Site URL*.

## Estructura
```
supabase/schema.sql              Base de datos, RLS, storage, categorías iniciales
supabase/functions/usuarios/     Edge Function: crear usuarios / cambiar contraseña (solo admin)
src/lib/                         Cliente Supabase, auth, consultas, formato, exportación Excel
src/pages/                       Inicio, Movimientos, Reportes, Categorías, Usuarios, Login
src/components/                  Layout, Modal de movimiento, componentes UI
```
