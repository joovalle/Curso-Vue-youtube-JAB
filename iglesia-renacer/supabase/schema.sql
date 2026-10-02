-- =====================================================================
--  Tesorería · Templo Cristiano Renacer
--  Ejecutar completo en: Supabase → SQL Editor → New query → Run
--  (es seguro volver a ejecutarlo)
-- =====================================================================

-- ---------- Tipos ----------
do $$ begin
  create type rol_usuario as enum ('admin', 'tesorero', 'consulta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_movimiento as enum ('ingreso', 'gasto');
exception when duplicate_object then null; end $$;

-- ---------- Tablas ----------
create table if not exists perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text not null default '',
  email      text not null default '',
  rol        rol_usuario not null default 'consulta',
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

create table if not exists categorias (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  tipo       tipo_movimiento not null,
  activa     boolean not null default true,
  creado_en  timestamptz not null default now(),
  unique (nombre, tipo)
);

create table if not exists movimientos (
  id               uuid primary key default gen_random_uuid(),
  fecha            date not null default current_date,
  tipo             tipo_movimiento not null,
  monto            numeric(14,2) not null check (monto > 0),
  categoria_id     uuid not null references categorias(id),
  descripcion      text not null default '',
  comprobante_path text,
  creado_por       uuid references perfiles(id) default auth.uid(),
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

create index if not exists movimientos_fecha_idx on movimientos (fecha desc);
create index if not exists movimientos_categoria_idx on movimientos (categoria_id);

-- ---------- Funciones auxiliares ----------
create or replace function rol_actual() returns rol_usuario
language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid() and activo
$$;

create or replace function es_activo() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and activo)
$$;

-- El tipo del movimiento siempre se toma de su categoría
create or replace function movimientos_antes_de_guardar() returns trigger
language plpgsql as $$
begin
  select tipo into new.tipo from categorias where id = new.categoria_id;
  new.actualizado_en := now();
  return new;
end $$;

drop trigger if exists movimientos_guardar on movimientos;
create trigger movimientos_guardar before insert or update on movimientos
  for each row execute function movimientos_antes_de_guardar();

-- Al registrarse un usuario se crea su perfil.
-- El PRIMER usuario del sistema queda como administrador.
create or replace function crear_perfil_nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, email, nombre, rol)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'nombre', split_part(coalesce(new.email, ''), '@', 1)),
    case when exists (select 1 from perfiles) then 'consulta'::rol_usuario else 'admin'::rol_usuario end
  );
  return new;
end $$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario after insert on auth.users
  for each row execute function crear_perfil_nuevo_usuario();

-- Saldo acumulado (ingresos - gastos) de todo lo anterior a una fecha
create or replace function saldo_anterior(hasta date) returns numeric
language sql stable security invoker as $$
  select coalesce(sum(case when tipo = 'ingreso' then monto else -monto end), 0)
  from movimientos where fecha < hasta
$$;

-- ---------- Seguridad (RLS) ----------
alter table perfiles    enable row level security;
alter table categorias  enable row level security;
alter table movimientos enable row level security;

-- perfiles
drop policy if exists perfiles_ver on perfiles;
create policy perfiles_ver on perfiles for select
  using (id = auth.uid() or es_activo());
drop policy if exists perfiles_admin_editar on perfiles;
create policy perfiles_admin_editar on perfiles for update
  using (rol_actual() = 'admin') with check (rol_actual() = 'admin');

-- categorias
drop policy if exists categorias_ver on categorias;
create policy categorias_ver on categorias for select using (es_activo());
drop policy if exists categorias_admin on categorias;
create policy categorias_admin on categorias for all
  using (rol_actual() = 'admin') with check (rol_actual() = 'admin');

-- movimientos: ven todos los activos; escriben admin y tesorero; borra solo admin
drop policy if exists movimientos_ver on movimientos;
create policy movimientos_ver on movimientos for select using (es_activo());
drop policy if exists movimientos_crear on movimientos;
create policy movimientos_crear on movimientos for insert
  with check (rol_actual() in ('admin', 'tesorero'));
drop policy if exists movimientos_editar on movimientos;
create policy movimientos_editar on movimientos for update
  using (rol_actual() in ('admin', 'tesorero')) with check (rol_actual() in ('admin', 'tesorero'));
drop policy if exists movimientos_borrar on movimientos;
create policy movimientos_borrar on movimientos for delete using (rol_actual() = 'admin');

-- ---------- Comprobantes (Storage privado) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists comprobantes_ver on storage.objects;
create policy comprobantes_ver on storage.objects for select
  using (bucket_id = 'comprobantes' and es_activo());
drop policy if exists comprobantes_subir on storage.objects;
create policy comprobantes_subir on storage.objects for insert
  with check (bucket_id = 'comprobantes' and rol_actual() in ('admin', 'tesorero'));
drop policy if exists comprobantes_editar on storage.objects;
create policy comprobantes_editar on storage.objects for update
  using (bucket_id = 'comprobantes' and rol_actual() in ('admin', 'tesorero'));
drop policy if exists comprobantes_borrar on storage.objects;
create policy comprobantes_borrar on storage.objects for delete
  using (bucket_id = 'comprobantes' and rol_actual() in ('admin', 'tesorero'));

-- ---------- Categorías iniciales ----------
insert into categorias (nombre, tipo) values
  ('Diezmos', 'ingreso'),
  ('Ofrendas', 'ingreso'),
  ('Donaciones especiales', 'ingreso'),
  ('Ofrenda misionera', 'ingreso'),
  ('Otros ingresos', 'ingreso'),
  ('Arriendo / Hipoteca del templo', 'gasto'),
  ('Servicios básicos (luz, agua, gas)', 'gasto'),
  ('Internet y telefonía', 'gasto'),
  ('Mantención y reparaciones', 'gasto'),
  ('Sueldos y honorarios', 'gasto'),
  ('Ayuda social', 'gasto'),
  ('Misiones y evangelismo', 'gasto'),
  ('Eventos y actividades', 'gasto'),
  ('Sonido, multimedia y equipos', 'gasto'),
  ('Insumos y materiales', 'gasto'),
  ('Otros gastos', 'gasto')
on conflict (nombre, tipo) do nothing;
