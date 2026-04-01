# 🏫 Sistema Disciplinario — Módulo Educativo El Dorado

Sistema web de gestión de infracciones escolares desarrollado para el **Módulo Educativo El Dorado** (Bolivia). Permite registrar, visualizar y analizar infracciones disciplinarias de estudiantes con control de acceso por roles.

---

## 🚀 Demo en producción

**URL:** [school-disciplinary-system.vercel.app](https://school-disciplinary-system-3u2s9wgrl-lermns-projects.vercel.app/login)

### Cuentas de demostración

| Rol           | Email / Código              | Contraseña     |
| ------------- | --------------------------- | -------------- |
| Administrador | `admin@colegiodorado.edu`   | `Admin2026#`   |
| Regente       | `regente@colegiodorado.edu` | `Regente2026#` |
| Estudiante 1  | `202601`                    | `mUSxhECx9D`   |
| Estudiante 2  | `202602`                    | `bsSXeV3RPW`   |

> Los estudiantes pueden ingresar directamente con su **código numérico** (ej: `202601`) sin necesidad de escribir el dominio.

---

## 📋 Descripción

El sistema cubre el proceso disciplinario escolar completo:

- El **administrador** gestiona estudiantes, tipos de falta e infracciones, y visualiza reportes estadísticos
- El **regente** registra infracciones leves desde un panel simplificado
- El **estudiante** consulta su propio historial de infracciones

El acceso está protegido por roles inyectados directamente en el JWT de Supabase, lo que evita consultas adicionales a la base de datos en cada carga de página.

---

## 🛠️ Stack tecnológico

| Capa          | Tecnología                        |
| ------------- | --------------------------------- |
| Framework     | Next.js 16 (App Router)           |
| Base de datos | Supabase (PostgreSQL)             |
| Autenticación | Supabase Auth + JWT personalizado |
| UI Components | shadcn/ui + Radix UI              |
| Estilos       | Tailwind CSS v4                   |
| Gráficos      | Recharts                          |
| Formularios   | React Hook Form + Zod             |
| Deploy        | Vercel                            |

---

## 🗂️ Estructura del proyecto

```
├── app/
│   ├── login/                          # Página de inicio de sesión
│   ├── dashboard/
│   │   ├── layout.tsx                  # Layout protegido con spinner
│   │   ├── admin/
│   │   │   ├── page.tsx                # Dashboard admin (stats + gráficos)
│   │   │   ├── estudiantes/            # Gestión de estudiantes (+ paginación)
│   │   │   ├── infracciones/           # Gestión de infracciones (+ paginación)
│   │   │   ├── tipos-falta/            # CRUD tipos de falta
│   │   │   ├── regentes/               # Perfil del regente
│   │   │   ├── reportes/               # Reportes y estadísticas
│   │   │   └── configuracion/          # Ajustes del sistema
│   │   ├── regente/
│   │   │   ├── page.tsx                # Panel del regente
│   │   │   └── historial/              # Historial de infracciones (+ paginación)
│   │   └── estudiante/
│   │       └── page.tsx                # Perfil e historial del estudiante
│   └── api/
│       └── admin/
│           ├── crear-estudiante/       # API route creación de estudiantes
│           └── eliminar-estudiante/    # API route eliminación con cascada
├── components/
│   ├── layout/
│   │   └── app-sidebar.tsx             # Sidebar unificado por rol
│   ├── ui/
│   │   └── pagination-controls.tsx     # Componente de paginación reutilizable
│   ├── admin/
│   │   └── crear-estudiante-modal.tsx  # Modal creación estudiante
│   └── regente/
│       └── registrar-infraccion-modal.tsx
├── lib/
│   ├── auth-context.tsx                # Contexto de autenticación global
│   ├── data.ts                         # Funciones de acceso a Supabase
│   ├── supabase.ts                     # Cliente browser (singleton)
│   ├── supabase-admin.ts               # Cliente service_role (solo API routes)
│   ├── helpers.ts                      # Utilidades: formatDate, getGravedadConfig
│   └── types.ts                        # Tipos TypeScript
└── proxy.ts                            # Middleware de protección de rutas (Next.js 16)
```

---

## 🗄️ Schema de base de datos

### Tablas

**`estudiantes`**

```
id              uuid (PK)
nombre_completo text
curso           enum: 1ro | 2do | 3ro | 4to | 5to | 6to
seccion         enum: A | B | C
direccion       text
activo          boolean
created_at      timestamptz
```

**`usuarios`** (perfiles vinculados a auth.users)

```
id              uuid (PK) → auth.users.id
nombre_completo text
rol             enum: admin | regente | estudiante
estudiante_id   uuid → estudiantes.id  (solo si rol = estudiante)
created_at      timestamptz
```

**`tipos_falta`**

```
id               uuid (PK)
nombre           text
descripcion      text
gravedad         enum: leve | grave | muy_grave
color            text (hex)
asignado_regente boolean  (solo faltas leves)
created_at       timestamptz
```

**`infracciones`**

```
id             uuid (PK)
estudiante_id  uuid → estudiantes.id
registrado_por uuid → usuarios.id
tipo_falta_id  uuid → tipos_falta.id
fecha          date
descripcion    text
created_at     timestamptz
```

### Row Level Security (RLS)

| Tabla          | Admin | Regente               | Estudiante   |
| -------------- | ----- | --------------------- | ------------ |
| `usuarios`     | CRUD  | Solo propio           | Solo propio  |
| `estudiantes`  | CRUD  | SELECT                | Solo propio  |
| `tipos_falta`  | CRUD  | SELECT                | SELECT       |
| `infracciones` | CRUD  | SELECT + INSERT leves | Solo propias |

> Adicionalmente existe la policy `auth_read_usuarios` que permite a cualquier usuario autenticado leer registros de `usuarios`, necesaria para resolver los joins en el historial de infracciones.

### JWT Hook

Se usa `custom_access_token_hook` para inyectar `rol`, `nombre_completo` y `estudiante_id` directamente en el token JWT. Esto evita consultas adicionales a la base de datos en cada request y permite que el middleware y el sidebar funcionen sin llamadas extra.

---

## 🔐 Autenticación

- Login con email + contraseña via Supabase Auth
- Los estudiantes usan su **código numérico** como login (`202601`); el sistema añade automáticamente el dominio `@colegiodorado.edu`
- El JWT incluye el rol del usuario — no se necesita consultar la DB para verificar permisos en ningún momento
- El middleware (`proxy.ts`) protege todas las rutas `/dashboard/*` y redirige según rol
- El sidebar se adapta automáticamente al rol del JWT

---

## 👤 Roles y permisos

### 🔴 Administrador

- Dashboard con estadísticas globales y gráficos en tiempo real
- CRUD completo de estudiantes con generación automática de credenciales
- Las credenciales del estudiante se muestran **una sola vez** al crearlo — no se almacenan en texto plano
- Registrar infracciones de cualquier gravedad para cualquier estudiante
- Gestionar tipos de falta: crear, editar y eliminar
- Ver perfil e historial del regente
- Reportes: tendencia mensual (líneas), infracciones por curso (barras), top 10 estudiantes

### 🟡 Regente

- Panel con listado de estudiantes activos del sistema
- Registrar únicamente infracciones **leves** marcadas como "asignado al regente"
- Ver historial completo de todas las infracciones del sistema
- No puede crear, editar ni eliminar estudiantes ni tipos de falta

### 🟢 Estudiante

- Ver su propio perfil: nombre, curso, sección, dirección
- Ver su historial de infracciones con detalle de cada una (tipo, gravedad, fecha, descripción)
- No puede ver datos de otros estudiantes ni registrar infracciones

---

## ⚙️ Variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` **nunca** debe llevar el prefijo `NEXT_PUBLIC_`. Solo se usa en API routes del servidor y otorga acceso total a la base de datos bypasseando RLS.

---

## 🚢 Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Ir a **Settings → Environment Variables** y agregar las tres variables de entorno
3. En **Settings → Build & Development Settings** configurar:
   - Install Command: `npm install`
   - Build Command: `npm run build`
4. Hacer **Deploy** — el build debería completarse sin errores

---

## 💻 Desarrollo local

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/school-disciplinary-system.git
cd school-disciplinary-system

# 2. Instalar dependencias
npm install

# 3. Crear .env.local con las variables de Supabase
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Iniciar servidor de desarrollo
npm run dev
```

La app corre en `http://localhost:3000`.

---

## 🗃️ Base de datos — Setup inicial

Para configurar la base de datos desde cero, ejecutar los siguientes scripts SQL en el **SQL Editor de Supabase** en este orden:

1. `schema_v3.sql` — Crea todas las tablas, enums, RLS policies y el JWT hook
2. `update_hook.sql` — Registra el hook `custom_access_token_hook` en Supabase Auth
3. `fix_rls_usuarios.sql` — Añade la policy `auth_read_usuarios` (necesaria para joins en historial)

Luego crear manualmente los usuarios admin y regente desde **Authentication → Users** en el panel de Supabase, e insertar sus perfiles en `public.usuarios`.

---

## 🐛 Bugs conocidos y soluciones documentadas

### Bug 1: Spinner infinito en login

**Causa:** `onAuthStateChange` no puede recibir un callback `async`. Supabase ignora el Promise retornado y `setIsInitialized(true)` nunca se ejecuta.

**Solución:** Callback síncrono + `.then()` para operaciones async:

```typescript
// ❌ Incorrecto
supabase.auth.onAuthStateChange(async (event, session) => {
  const profile = await fetchProfile(session);
  setIsInitialized(true); // nunca se ejecuta
});

// ✅ Correcto
supabase.auth.onAuthStateChange((event, session) => {
  fetchProfile(session).then((profile) => {
    setIsInitialized(true);
  });
});
```

### Bug 2: "Database error creating new user" al crear estudiantes

**Causa:** Pasar `raw_user_meta_data` con un UUID de `estudiante_id` como string al trigger `handle_new_user` provocaba un fallo en el cast a UUID.

**Solución:** No pasar metadata al `createUser`. Insertar manualmente en `public.usuarios` usando el cliente `supabaseAdmin` (service_role bypasea RLS).

### Bug 3: Middleware ignorado silenciosamente en Next.js 16

**Causa:** Next.js 16 deprecó `middleware.ts`. El archivo era ignorado sin errores y las rutas quedaban completamente desprotegidas.

**Solución:** Renombrar a `proxy.ts` y exportar la función como `proxy` en vez de `middleware`.

### Bug 4: Join de `usuarios` devuelve null en historial

**Causa:** RLS en `usuarios` solo permitía a cada usuario ver su propio registro. Al hacer `usuarios!registrado_por` en el join de infracciones, el registro del admin o regente que registró la infracción quedaba bloqueado.

**Solución:**

```sql
CREATE POLICY "auth_read_usuarios" ON usuarios
  FOR SELECT USING (auth.role() = 'authenticated');
```

### Bug 5: Fechas con desfase de un día (timezone)

**Causa:** `new Date("2026-03-01")` interpreta la fecha como UTC, lo que en zonas horarias con offset negativo (como Bolivia, UTC-4) devuelve el día anterior.

**Solución:** Parsear la fecha con componentes locales:

```typescript
// ❌ Incorrecto
new Date("2026-03-01") // → 28 feb en Bolivia

// ✅ Correcto
const [year, month, day] = dateStr.split("-").map(Number);
new Date(year, month - 1, day); // → 1 mar, sin conversión de zona horaria
```

---

## 📝 Decisiones de arquitectura

| Decisión | Razonamiento |
|---|---|
| **Un solo regente** en el sistema | Restricción de negocio del colegio |
| **Credenciales mostradas una sola vez** | No se almacenan en texto plano; el admin debe anotarlas al crearlas |
| **Código de estudiante** `año + secuencial` (ej: `202601`) | Simple, predecible y único dentro del año |
| **`supabase-admin.ts`** solo en API routes | El `SERVICE_ROLE_KEY` nunca llega al cliente browser |
| **Singleton del cliente Supabase** | Evita múltiples instancias WebSocket en re-renders |
| **JWT hook** inyecta el rol | El middleware y el sidebar funcionan sin consultas adicionales a la DB |
| **Borrar estudiante con cascada** | Elimina infracciones → perfil `public.usuarios` → cuenta `auth.users` en ese orden |
| **Plan gratuito de Supabase** | Suficiente para 500–700 alumnos con el volumen de datos actual |
| **URL de Vercel sin dominio propio** | Adecuado para el uso interno del colegio en esta etapa |
| **Backups manuales semanales** | Exportar CSV desde el Table Editor de Supabase cada viernes |

---

## 🔮 Próximas funcionalidades

Estas funcionalidades están previstas para iteraciones futuras sobre el MVP actual:

- **📚 Notas trimestrales** — El administrador carga calificaciones por asignatura; el estudiante las consulta desde su panel
- **💳 Control de mensualidades** — Registro de pagos mensuales; el acceso a notas puede condicionarse al estado de pago
- **🐾 Iconos de estado en perfiles** — Representación visual del estado del estudiante según infracciones, notas y pagos
- **📢 Tablón de anuncios público** — Página accesible sin login para comunicados del colegio

---

## 👨‍💻 Desarrollado por

**Leonardo Ramos** — © 2026 Todos los derechos reservados.

Desarrollado para el **Módulo Educativo El Dorado**, Santa Cruz - Bolivia.