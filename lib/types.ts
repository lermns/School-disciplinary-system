export type Rol = 'admin' | 'regente' | 'estudiante';
export type Gravedad = 'leve' | 'grave' | 'muy_grave';

export interface Usuario {
  id: string;
  email: string; // Para rol "estudiante", este campo es su código (ej: "1001")
  nombre_completo: string;
  rol: Rol;
  avatar_url: string | null;
  created_at: string;
  estudiante_id?: string; // Solo para rol "estudiante"
}

export interface Estudiante {
  id: string;
  nombre_completo: string;
  curso: string;
  seccion: string;
  direccion: string;
  foto_url: string | null;
  activo: boolean;
  created_at: string;
}

export interface TipoFalta {
  id: string;
  nombre: string;
  descripcion: string;
  gravedad: Gravedad;
  color: string;
}

export interface Infraccion {
  id: string;
  estudiante_id: string;
  regente_id: string;
  tipo_falta_id: string;
  fecha: string;
  descripcion: string;
  created_at: string;
  // Joined fields
  estudiante?: Estudiante;
  regente?: Usuario;
  tipo_falta?: TipoFalta;
}
