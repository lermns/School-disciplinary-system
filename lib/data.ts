import { createClient } from '@/lib/supabase';
import type { Estudiante, TipoFalta, Infraccion, Usuario, Gravedad } from '@/lib/types';

// ── Mappers DB → TypeScript ────────────────────────────────
// La columna en DB es "registrado_por" pero en el tipo TS es "regente_id"
// La columna en DB es "asignado_regente" pero en el tipo TS es "asignadoRegente"

export function mapTipoFalta(row: any): TipoFalta {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    gravedad: row.gravedad as Gravedad,
    color: row.color,
    asignadoRegente: row.asignado_regente ?? false,
  };
}

function mapInfraccion(row: any): Infraccion {
  return {
    id: row.id,
    estudiante_id: row.estudiante_id,
    regente_id: row.registrado_por, // mapeo DB → TS
    tipo_falta_id: row.tipo_falta_id,
    fecha: row.fecha,
    descripcion: row.descripcion ?? '',
    created_at: row.created_at,
    estudiante: row.estudiante as Estudiante | undefined,
    regente: row.registrado_por_usuario as Usuario | undefined,
    tipo_falta: row.tipo_falta ? mapTipoFalta(row.tipo_falta) : undefined,
  };
}

const INF_SELECT = `
  id, estudiante_id, registrado_por, tipo_falta_id, fecha, descripcion, created_at,
  estudiante:estudiantes(*),
  registrado_por_usuario:usuarios!registrado_por(*),
  tipo_falta:tipos_falta(*)
`;

// ── Reads ──────────────────────────────────────────────────

export async function fetchEstudiantes(soloActivos = false): Promise<Estudiante[]> {
  const supabase = createClient();
  let query = supabase.from('estudiantes').select('*').order('nombre_completo');
  if (soloActivos) query = query.eq('activo', true);
  const { data, error } = await query;
  if (error) {
    console.error('fetchEstudiantes:', error);
    return [];
  }
  return (data ?? []) as Estudiante[];
}

export async function fetchTiposFalta(): Promise<TipoFalta[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('tipos_falta').select('*').order('nombre');
  if (error) {
    console.error('fetchTiposFalta:', error);
    return [];
  }
  return (data ?? []).map(mapTipoFalta);
}

export async function fetchInfracciones(): Promise<Infraccion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('infracciones')
    .select(INF_SELECT)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchInfracciones:', error);
    return [];
  }
  return (data ?? []).map(mapInfraccion);
}

export async function fetchInfraccionesByEstudiante(
  estudianteId: string,
): Promise<Infraccion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('infracciones')
    .select(INF_SELECT)
    .eq('estudiante_id', estudianteId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchInfraccionesByEstudiante:', error);
    return [];
  }
  return (data ?? []).map(mapInfraccion);
}

export async function fetchUsuarios(): Promise<Usuario[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) {
    console.error('fetchUsuarios:', error);
    return [];
  }
  return (data ?? []) as Usuario[];
}

// ── Writes ─────────────────────────────────────────────────

export async function createInfraccion(payload: {
  estudiante_id: string;
  registrado_por: string;
  tipo_falta_id: string;
  fecha: string;
  descripcion: string;
}): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.from('infracciones').insert(payload);
  return error?.message ?? null;
}

export async function createTipoFalta(payload: {
  nombre: string;
  descripcion: string;
  gravedad: string;
  color: string;
  asignado_regente: boolean;
}): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.from('tipos_falta').insert(payload);
  return error?.message ?? null;
}

export async function updateTipoFalta(
  id: string,
  payload: {
    nombre: string;
    descripcion: string;
    gravedad: string;
    color: string;
    asignado_regente: boolean;
  },
): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.from('tipos_falta').update(payload).eq('id', id);
  return error?.message ?? null;
}

export async function deleteTipoFalta(id: string): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.from('tipos_falta').delete().eq('id', id);
  return error?.message ?? null;
}
