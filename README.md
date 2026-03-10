# 🏫 Sistema Disciplinario — Módulo Educativo El Dorado

Sistema web de gestión de infracciones escolares desarrollado para el **Módulo Educativo El Dorado**. Permite registrar, visualizar y analizar infracciones disciplinarias de estudiantes con control de acceso por roles.

> ⚠️ **Documentación en progreso** — será actualizada cuando el proyecto esté completamente terminado.

---

## 🚀 Demo en producción

**URL:** [school-disciplinary-system.vercel.app](https://school-disciplinary-system-3u2s9wgrl-lermns-projects.vercel.app/login)

### Cuentas de demostración

| Rol           | Email                       | Contraseña     |
| ------------- | --------------------------- | -------------- |
| Administrador | `admin@colegiodorado.edu`   | `Admin2026#`   |
| Regente       | `regente@colegiodorado.edu` | `Regente2026#` |
| Estudiante 1  | `202601@colegiodorado.edu`  | `mUSxhECx9D`   |
| Estudiante 2  | `202602@colegiodorado.edu`  | `bsSXeV3RPW`   |

---

## 📋 Descripción

El sistema gestiona el proceso disciplinario escolar completo:

- El **administrador** gestiona estudiantes, tipos de falta, infracciones y visualiza reportes
- El **regente** registra infracciones leves desde un panel simplificado
- El **estudiante** consulta su propio historial de infracciones

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
│   │   │   ├── estudiantes/            # Gestión de estudiantes
│   │   │   ├── infracciones/           # Gestión de infracciones
│   │   │   ├── tipos-falta/            # CRUD tipos de falta
│   │   │   ├── regentes/               # Perfil del regente
│   │   │   ├── reportes/               # Reportes y estadísticas
│   │   │   └── configuracion/          # Ajustes del sistema
│   │   ├── regente/
│   │   │   ├── page.tsx                # Panel del regente
│   │   │   └── historial/              # Historial de infracciones
│   │   └── estudiante/
│   │       └── page.tsx                # Perfil del estudiante
│   └── api/
│       └── admin/
│           └── crear-estudiante/       # API route creación de estudiantes
├── components/
│   ├── layout/
│   │   └── app-sidebar.tsx             # Sidebar unificado por rol
│   ├── admin/
│   │   └── crear-estudiante-modal.tsx  # Modal creación estudiante
│   └── regente/
│       └── registrar-infraccion-modal.tsx
├── lib/
│   ├── auth-context.tsx                # Contexto de autenticación
│   ├── data.ts                         # Funciones de acceso a Supabase
│   ├── supabase.ts                     # Cliente browser
│   ├── supabase-admin.ts               # Cliente service_role (solo API routes)
│   ├── helpers.ts                      # Utilidades (formatDate, getGravedadConfig)
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
curso           enum: 1ro|2do|3ro|4to|5to|6to
seccion         enum: A|B|C
direccion       text
activo          boolean
created_at      timestamptz
```

**`usuarios`** (perfiles vinculados a auth.users)

```
id              uuid (PK) → auth.users.id
nombre_completo text
rol             enum: admin|regente|estudiante
estudiante_id   uuid → estudiantes.id (solo si rol=estudiante)
created_at      timestamptz
```

**`tipos_falta`**

```
id               uuid (PK)
nombre           text
descripcion      text
gravedad         enum: leve|grave|muy_grave
color            text (hex)
asignado_regente boolean (solo faltas leves)
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

### JWT Hook

Se usa `custom_access_token_hook` para inyectar `rol`, `nombre_completo` y `estudiante_id` directamente en el token JWT, evitando consultas adicionales a la DB en cada request.

---

## 🔐 Autenticación

- Login con email + contraseña via Supabase Auth
- Los estudiantes usan su **código numérico** como email: `202601@colegiodorado.edu`
- El JWT incluye el rol del usuario — no se necesita consultar la DB para verificar permisos
- El middleware (`proxy.ts`) protege todas las rutas `/dashboard/*`
- El sidebar se adapta automáticamente según el rol del JWT

---

## 👤 Roles y permisos

### Administrador

- Ver dashboard con estadísticas globales y gráficos
- CRUD completo de estudiantes (con generación automática de credenciales)
- Registrar infracciones de cualquier gravedad
- Gestionar tipos de falta (crear, editar, eliminar)
- Ver perfil e historial del regente
- Ver reportes: tendencia mensual, infracciones por curso, top 10 estudiantes

### Regente

- Ver panel con listado de estudiantes activos
- Registrar únicamente infracciones **leves** marcadas como "asignado al regente"
- Ver historial completo de todas las infracciones del sistema
- No puede crear ni modificar estudiantes ni tipos de falta

### Estudiante

- Ver su propio perfil: nombre, curso, sección, dirección
- Ver su historial de infracciones con detalle de cada una
- No puede ver datos de otros estudiantes

---

## ⚙️ Variables de entorno

Crear archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

> `SUPABASE_SERVICE_ROLE_KEY` **nunca** debe llevar el prefijo `NEXT_PUBLIC_`. Solo se usa en API routes del servidor.

---

## 🚢 Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Ir a **Settings → Environment Variables** y agregar las tres variables de entorno
3. Hacer **Redeploy** — el build debería completarse sin errores

---

## 💻 Desarrollo local

```bash
# Instalar dependencias
npm install

# Crear .env.local con las variables de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

La app corre en `http://localhost:3000`.

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

**Causa:** Pasar `raw_user_meta_data` con un UUID de `estudiante_id` como string al trigger `handle_new_user` provoca un fallo en el cast.

**Solución:** No pasar metadata al `createUser`. Insertar manualmente en `public.usuarios` usando el cliente `supabaseAdmin` (service_role bypasea RLS).

### Bug 3: Middleware ignorado silenciosamente en Next.js 16

**Causa:** Next.js 16 deprecó `middleware.ts`. El archivo era ignorado y las rutas quedaban sin protección.

**Solución:** Renombrar a `proxy.ts` y exportar la función como `proxy` en vez de `middleware`.

### Bug 4: Join de `usuarios` devuelve null en historial

**Causa:** RLS en `usuarios` solo permitía a cada usuario ver su propio registro. Al hacer el join `usuarios!registrado_por` en infracciones, el registro del admin/regente que registró la infracción quedaba bloqueado.

**Solución:**

```sql
CREATE POLICY "auth_read_usuarios" ON usuarios
  FOR SELECT USING (auth.role() = 'authenticated');
```

---

## 📝 Decisiones de arquitectura

- **Un solo regente** en el sistema (restricción de negocio)
- **Credenciales de estudiante mostradas una sola vez** al crear — no se almacenan en texto plano
- **Código de estudiante** generado automáticamente: `año + secuencial` (ej: `202601`)
- **`lib/supabase-admin.ts`** con `SERVICE_ROLE_KEY` solo se usa en API routes del servidor, nunca en el cliente
- **Singleton de cliente Supabase** en el browser para evitar múltiples instancias
- **JWT hook** inyecta el rol en el token — no se necesita consultar `usuarios` en cada render
- **Borrar estudiante** elimina en cascada infracciones y perfil de usuario

---

## 👨‍💻 Desarrollado por

Leonardo Ramos — © 2026 Todos los derechos reservados.
