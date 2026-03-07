-- ============================================================
-- COLEGIO EL DORADO — Schema v3 (definitivo para Supabase)
-- ============================================================
-- NOTAS DE ARQUITECTURA:
--   • auth.users     → gestionada por Supabase Auth (contraseñas, sesiones)
--   • public.usuarios → perfil vinculado a auth.users via mismo UUID
--   • Estudiantes usan su código numérico como "email" en Auth
--     ej: código 202603 → email "202603" en auth.users
--   • Al borrar un estudiante: se borran en cascada sus infracciones
--     y su fila en usuarios. El admin también elimina el auth.user
--     desde la API route (service_role).
-- ============================================================

-- ── Extensiones ─────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── ENUMs ───────────────────────────────────────────────────
create type rol_usuario   as enum ('admin', 'regente', 'estudiante');
create type gravedad_falta as enum ('leve', 'grave', 'muy_grave');

-- ── Estudiantes ─────────────────────────────────────────────
-- Se crea ANTES que usuarios porque usuarios.estudiante_id la referencia
create table estudiantes (
  id              uuid primary key default uuid_generate_v4(),
  nombre_completo text    not null,
  curso           text    not null check (curso in ('1ro','2do','3ro','4to','5to','6to')),
  seccion         text    not null check (seccion in ('A','B','C')),
  direccion       text    not null,
  activo          boolean not null default true,
  created_at      timestamptz default now()
);

-- ── Usuarios (perfiles) ──────────────────────────────────────
-- id = mismo UUID que auth.users (Supabase lo enlaza automáticamente)
create table usuarios (
  id              uuid primary key references auth.users(id) on delete cascade,
  nombre_completo text          not null,
  rol             rol_usuario   not null default 'estudiante',
  estudiante_id   uuid          references estudiantes(id) on delete cascade,
  created_at      timestamptz   default now(),

  -- Un estudiante solo puede tener un usuario vinculado
  constraint uq_estudiante_usuario unique (estudiante_id),
  -- Solo rol 'estudiante' puede tener estudiante_id
  constraint chk_estudiante_id check (
    (rol = 'estudiante' and estudiante_id is not null) or
    (rol <> 'estudiante' and estudiante_id is null)
  )
);

-- ── Tipos de Falta ──────────────────────────────────────────
create table tipos_falta (
  id               uuid           primary key default uuid_generate_v4(),
  nombre           text           not null,
  descripcion      text,
  gravedad         gravedad_falta not null,
  color            text           not null default '#22c55e',
  asignado_regente boolean        not null default false,
  created_at       timestamptz    default now(),

  -- Solo faltas leves pueden asignarse al regente
  constraint chk_asignado_regente check (
    asignado_regente = false or gravedad = 'leve'
  )
);

-- ── Infracciones ────────────────────────────────────────────
create table infracciones (
  id              uuid  primary key default uuid_generate_v4(),
  estudiante_id   uuid  not null references estudiantes(id) on delete cascade,
  registrado_por  uuid  not null references usuarios(id),      -- admin o regente
  tipo_falta_id   uuid  not null references tipos_falta(id),
  fecha           date  not null default current_date,
  descripcion     text,
  created_at      timestamptz default now()
);

-- ── Índices ─────────────────────────────────────────────────
create index idx_infracciones_estudiante  on infracciones(estudiante_id);
create index idx_infracciones_fecha       on infracciones(fecha desc);
create index idx_infracciones_tipo        on infracciones(tipo_falta_id);
create index idx_infracciones_registrador on infracciones(registrado_por);
create index idx_estudiantes_curso        on estudiantes(curso, seccion);
create index idx_usuarios_rol             on usuarios(rol);

-- ── Función: inyectar rol en el JWT ─────────────────────────
-- Supabase llama a esta función al generar el token.
-- Permite usar auth.jwt() ->> 'rol' en las RLS policies.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims   jsonb;
  user_rol rol_usuario;
begin
  select rol into user_rol
  from public.usuarios
  where id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';

  if user_rol is not null then
    claims := jsonb_set(claims, '{rol}', to_jsonb(user_rol::text));
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Darle permisos al hook
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- ── Trigger: crear perfil automáticamente al registrar auth.user ──
-- Cuando se crea un usuario en auth.users desde la API route,
-- este trigger inserta automáticamente la fila en public.usuarios.
-- Los datos extra (nombre, rol, estudiante_id) vienen en raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre_completo, rol, estudiante_id)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nombre_completo',
    (new.raw_user_meta_data ->> 'rol')::rol_usuario,
    (new.raw_user_meta_data ->> 'estudiante_id')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ───────────────────────────────────────
alter table usuarios     enable row level security;
alter table estudiantes  enable row level security;
alter table tipos_falta  enable row level security;
alter table infracciones enable row level security;

-- ── Policies: usuarios ───────────────────────────────────────
-- Admin: acceso total
create policy "admin_all_usuarios" on usuarios
  using (auth.jwt() ->> 'rol' = 'admin');

-- Cualquier usuario autenticado puede leer su propio perfil
create policy "own_read_usuarios" on usuarios
  for select using (id = auth.uid());

-- ── Policies: estudiantes ────────────────────────────────────
-- Admin: acceso total
create policy "admin_all_estudiantes" on estudiantes
  using (auth.jwt() ->> 'rol' = 'admin');

-- Regente: solo lectura
create policy "regente_read_estudiantes" on estudiantes
  for select using (auth.jwt() ->> 'rol' = 'regente');

-- Estudiante: solo puede leer su propio registro
create policy "estudiante_read_own" on estudiantes
  for select using (
    id = (
      select estudiante_id from usuarios where id = auth.uid()
    )
  );

-- ── Policies: tipos_falta ────────────────────────────────────
-- Admin: acceso total (CRUD)
create policy "admin_all_tipos_falta" on tipos_falta
  using (auth.jwt() ->> 'rol' = 'admin');

-- Regente y estudiante: solo lectura
create policy "auth_read_tipos_falta" on tipos_falta
  for select using (auth.role() = 'authenticated');

-- ── Policies: infracciones ───────────────────────────────────
-- Admin: acceso total
create policy "admin_all_infracciones" on infracciones
  using (auth.jwt() ->> 'rol' = 'admin');

-- Regente: lee todas, solo inserta faltas leves asignadas a regente
create policy "regente_read_infracciones" on infracciones
  for select using (auth.jwt() ->> 'rol' = 'regente');

create policy "regente_insert_infracciones" on infracciones
  for insert
  with check (
    auth.jwt() ->> 'rol' = 'regente'
    and exists (
      select 1 from tipos_falta tf
      where tf.id = tipo_falta_id
        and tf.gravedad = 'leve'
        and tf.asignado_regente = true
    )
  );

-- Estudiante: solo ve sus propias infracciones
create policy "estudiante_read_own_infracciones" on infracciones
  for select using (
    auth.jwt() ->> 'rol' = 'estudiante'
    and estudiante_id = (
      select estudiante_id from usuarios where id = auth.uid()
    )
  );

-- ── Seed: Tipos de Falta ─────────────────────────────────────
insert into tipos_falta (nombre, descripcion, gravedad, color, asignado_regente) values
  ('Retraso',             'El estudiante llega tarde al inicio de clases o después del cambio de hora', 'leve',      '#22c55e', true),
  ('Falta',               'Ausencia del estudiante sin justificación válida',                           'leve',      '#22c55e', true),
  ('Uso de celular',      'Uso no autorizado de dispositivos móviles durante clase o evaluación',       'leve',      '#22c55e', true),
  ('Uniforme',            'No portar el uniforme escolar completo según el reglamento interno',         'leve',      '#22c55e', true),
  ('Conducta disruptiva', 'Comportamiento que interrumpe el normal desarrollo de la clase',            'grave',     '#eab308', false),
  ('Copia en examen',     'Fraude académico durante evaluaciones escritas u orales',                   'grave',     '#eab308', false),
  ('Daño a propiedad',    'Deterioro intencional de instalaciones o materiales del colegio',           'grave',     '#eab308', false),
  ('Agresión física',     'Violencia física contra otro estudiante o miembro del personal',            'muy_grave', '#ef4444', false),
  ('Bullying',            'Acoso sistemático hacia otro estudiante de forma verbal, física o digital', 'muy_grave', '#ef4444', false);


-- ============================================================
-- PASOS MANUALES DESPUÉS DE EJECUTAR ESTE SCHEMA
-- (hacer en el dashboard de Supabase, no en SQL)
-- ============================================================
--
-- 1. ACTIVAR EL HOOK DEL JWT:
--    Dashboard → Authentication → Hooks
--    → "Custom Access Token Hook"
--    → Seleccionar función: public.custom_access_token_hook
--
-- 2. CREAR USUARIO ADMIN manualmente:
--    Dashboard → Authentication → Users → "Add user"
--    Email:    202600educadorado
--    Password: (mínimo 8 chars, la que quieras)
--    Luego en SQL Editor:
--    insert into usuarios (id, nombre_completo, rol)
--    values ('<UUID del admin recién creado>', 'Carlos Mendoza', 'admin');
--
-- 3. CREAR USUARIO REGENTE manualmente igual:
--    Email:    202600educaregente
--    Password: (mínimo 8 chars)
--    Luego en SQL Editor:
--    insert into usuarios (id, nombre_completo, rol)
--    values ('<UUID del regente recién creado>', 'María García', 'regente');
--
-- 4. Los estudiantes se crean desde la app (API route con service_role).
--    El trigger handle_new_user() inserta automáticamente en public.usuarios.
--
-- ============================================================