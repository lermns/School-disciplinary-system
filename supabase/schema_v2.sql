-- ============================================================
-- COLEGIO EL DORADO - Schema v2
-- Cambios: regente (antes profesor), estudiante (antes padre)
-- Elimina: estado en infracciones, fecha_nacimiento en estudiantes
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ── ENUM tipos ──────────────────────────────────────────────
create type rol_usuario as enum ('admin', 'regente', 'estudiante');
create type gravedad_falta as enum ('leve', 'grave', 'muy_grave');

-- ── Usuarios ────────────────────────────────────────────────
create table usuarios (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,  -- Para estudiantes: su código (ej: "1001")
  nombre_completo text not null,
  rol           rol_usuario not null default 'estudiante',
  avatar_url    text,
  estudiante_id uuid,                  -- Solo para rol 'estudiante'
  created_at    timestamptz default now()
);

-- ── Estudiantes ─────────────────────────────────────────────
-- Cursos: 1ro, 2do, 3ro, 4to, 5to, 6to
-- Secciones: A, B, C
create table estudiantes (
  id              uuid primary key default uuid_generate_v4(),
  nombre_completo text not null,
  curso           text not null check (curso in ('1ro','2do','3ro','4to','5to','6to')),
  seccion         text not null check (seccion in ('A','B','C')),
  direccion       text not null,
  foto_url        text,
  activo          boolean default true,
  created_at      timestamptz default now()
);

-- FK usuario -> estudiante
alter table usuarios
  add constraint fk_usuario_estudiante
  foreign key (estudiante_id) references estudiantes(id) on delete set null;

-- ── Tipos de Falta ──────────────────────────────────────────
create table tipos_falta (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  descripcion text,
  gravedad    gravedad_falta not null,
  color       text default '#22c55e',
  created_at  timestamptz default now()
);

-- ── Infracciones (sin campo 'estado') ──────────────────────
create table infracciones (
  id              uuid primary key default uuid_generate_v4(),
  estudiante_id   uuid not null references estudiantes(id) on delete cascade,
  regente_id      uuid not null references usuarios(id),
  tipo_falta_id   uuid not null references tipos_falta(id),
  fecha           date not null default current_date,
  descripcion     text,
  created_at      timestamptz default now()
);

-- ── Índices ─────────────────────────────────────────────────
create index idx_infracciones_estudiante on infracciones(estudiante_id);
create index idx_infracciones_fecha on infracciones(fecha desc);
create index idx_infracciones_tipo on infracciones(tipo_falta_id);
create index idx_estudiantes_curso on estudiantes(curso, seccion);

-- ── Row Level Security ───────────────────────────────────────
alter table usuarios     enable row level security;
alter table estudiantes  enable row level security;
alter table tipos_falta  enable row level security;
alter table infracciones enable row level security;

-- Admin: acceso total
create policy "Admin full access" on usuarios
  using (auth.jwt() ->> 'rol' = 'admin');

create policy "Admin full access" on estudiantes
  using (auth.jwt() ->> 'rol' = 'admin');

create policy "Admin full access" on tipos_falta
  using (auth.jwt() ->> 'rol' = 'admin');

create policy "Admin full access" on infracciones
  using (auth.jwt() ->> 'rol' = 'admin');

-- Regente: lee estudiantes y tipos_falta, inserta infracciones leves
create policy "Regente read estudiantes" on estudiantes
  for select using (auth.jwt() ->> 'rol' = 'regente');

create policy "Regente read tipos_falta" on tipos_falta
  for select using (auth.jwt() ->> 'rol' = 'regente');

create policy "Regente insert infracciones leves" on infracciones
  for insert
  with check (
    auth.jwt() ->> 'rol' = 'regente'
    and exists (
      select 1 from tipos_falta tf
      where tf.id = tipo_falta_id and tf.gravedad = 'leve'
    )
  );

-- Estudiante: solo ve sus propias infracciones
create policy "Estudiante read own infracciones" on infracciones
  for select
  using (
    auth.jwt() ->> 'rol' = 'estudiante'
    and estudiante_id = (
      select estudiante_id from usuarios
      where id = auth.uid()
    )
  );

-- ── Seed: Tipos de Falta ─────────────────────────────────────
insert into tipos_falta (nombre, descripcion, gravedad, color) values
  ('Retraso',             'El estudiante llega tarde al inicio de clases o después del cambio de hora', 'leve',      '#22c55e'),
  ('Falta',               'Ausencia del estudiante sin justificación válida',                            'leve',      '#22c55e'),
  ('Uso de celular',      'Uso no autorizado de dispositivos móviles durante clase o evaluación',        'leve',      '#22c55e'),
  ('Uniforme',            'No portar el uniforme escolar completo según el reglamento interno',          'leve',      '#22c55e'),
  ('Conducta disruptiva', 'Comportamiento que interrumpe el normal desarrollo de la clase',             'grave',     '#eab308'),
  ('Copia en examen',     'Fraude académico durante evaluaciones escritas u orales',                    'grave',     '#eab308'),
  ('Daño a propiedad',    'Deterioro intencional de instalaciones o materiales del colegio',            'grave',     '#eab308'),
  ('Agresión física',     'Violencia física contra otro estudiante o miembro del personal',             'muy_grave', '#ef4444'),
  ('Bullying',            'Acoso sistemático hacia otro estudiante',                                    'muy_grave', '#ef4444');