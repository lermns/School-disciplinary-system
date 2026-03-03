// Database types matching the Supabase schema

export type Rol = "admin" | "profesor" | "padre"
export type Gravedad = "leve" | "grave" | "muy_grave"
export type EstadoInfraccion = "pendiente" | "resuelto" | "apelado"

export interface Usuario {
  id: string
  email: string
  nombre_completo: string
  rol: Rol
  avatar_url: string | null
  created_at: string
}

export interface Estudiante {
  id: string
  nombre_completo: string
  curso: string
  seccion: string
  fecha_nacimiento: string
  direccion: string
  foto_url: string | null
  activo: boolean
  created_at: string
}

export interface PadreEstudiante {
  id: string
  usuario_id: string
  estudiante_id: string
}

export interface TipoFalta {
  id: string
  nombre: string
  descripcion: string
  gravedad: Gravedad
  color: string
}

export interface Infraccion {
  id: string
  estudiante_id: string
  profesor_id: string
  tipo_falta_id: string
  fecha: string
  descripcion: string
  sancion: string
  estado: EstadoInfraccion
  created_at: string
  // Joined fields
  estudiante?: Estudiante
  profesor?: Usuario
  tipo_falta?: TipoFalta
}
