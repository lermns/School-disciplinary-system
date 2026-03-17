import { createClient } from '@/lib/supabase';
import type {
  Estudiante,
  TipoFalta,
  Infraccion,
  Usuario,
  Gravedad,
  ProfesorCurso,
  Profesor,
} from '@/lib/types';

// ── Mappers DB → TypeScript ────────────────────────────────

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
    regente_id: row.registrado_por,
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

// ✨ NUEVO: Versión PAGINADA de fetchEstudiantes
export async function fetchEstudiantesPaginados(
  page = 1,
  limit = 50,
  filters?: { curso?: string; seccion?: string; search?: string },
): Promise<{ data: Estudiante[]; total: number; hasMore: boolean }> {
  const supabase = createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('estudiantes')
    .select('*', { count: 'exact' })
    .eq('activo', true)
    .order('nombre_completo');

  // Aplicar filtros
  if (filters?.curso) query = query.eq('curso', filters.curso);
  if (filters?.seccion) query = query.eq('seccion', filters.seccion);
  if (filters?.search) {
    query = query.ilike('nombre_completo', `%${filters.search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('fetchEstudiantesPaginados:', error);
    return { data: [], total: 0, hasMore: false };
  }

  const total = count ?? 0;
  const hasMore = to < total - 1;

  return { data: (data ?? []) as Estudiante[], total, hasMore };
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

// ✨ OPTIMIZADO: Limitar infracciones por defecto
export async function fetchInfracciones(limit = 200): Promise<Infraccion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('infracciones')
    .select(INF_SELECT)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('fetchInfracciones:', error);
    return [];
  }
  return (data ?? []).map(mapInfraccion);
}

// ✨ NUEVO: Infracciones paginadas
export async function fetchInfraccionesPaginadas(
  page = 1,
  limit = 50,
  filters?: { gravedad?: string; tipo?: string; search?: string },
): Promise<{ data: Infraccion[]; total: number; hasMore: boolean }> {
  const supabase = createClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('infracciones')
    .select(INF_SELECT, { count: 'exact' })
    .order('created_at', { ascending: false });

  // Aplicar filtros (nota: estos requieren joins, evaluar performance)
  if (filters?.tipo) query = query.eq('tipo_falta_id', filters.tipo);

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('fetchInfraccionesPaginadas:', error);
    return { data: [], total: 0, hasMore: false };
  }

  const total = count ?? 0;
  const hasMore = to < total - 1;

  // Filtrado adicional en cliente si es necesario (search, gravedad)
  let filteredData = (data ?? []).map(mapInfraccion);

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredData = filteredData.filter(
      (inf) =>
        inf.estudiante?.nombre_completo.toLowerCase().includes(searchLower) ||
        inf.tipo_falta?.nombre.toLowerCase().includes(searchLower) ||
        inf.descripcion.toLowerCase().includes(searchLower),
    );
  }

  if (filters?.gravedad && filters.gravedad !== 'all') {
    filteredData = filteredData.filter((inf) => inf.tipo_falta?.gravedad === filters.gravedad);
  }

  return { data: filteredData, total, hasMore };
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

// ── Profesores ─────────────────────────────────────────────

export async function fetchProfesores(): Promise<Profesor[]> {
  const supabase = createClient();
  const { data: usuarios, error: errU } = await supabase
    .from('usuarios')
    .select('*')
    .eq('rol', 'profesor')
    .order('nombre_completo');
  if (errU) {
    console.error('fetchProfesores:', errU);
    return [];
  }
  if (!usuarios?.length) return [];

  const ids = usuarios.map((u) => u.id);
  const { data: cursos, error: errC } = await supabase
    .from('profesor_cursos')
    .select('*')
    .in('profesor_id', ids);
  if (errC) {
    console.error('fetchProfesorCursos:', errC);
  }

  return (usuarios as Usuario[]).map((u) => ({
    ...u,
    cursos: ((cursos ?? []) as ProfesorCurso[]).filter((c) => c.profesor_id === u.id),
  }));
}

export async function fetchProfesorCursos(profesorId: string): Promise<ProfesorCurso[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profesor_cursos')
    .select('*')
    .eq('profesor_id', profesorId);
  if (error) {
    console.error('fetchProfesorCursos:', error);
    return [];
  }
  return (data ?? []) as ProfesorCurso[];
}

/** Todos los estudiantes activos — profesores pueden ver cualquier estudiante */
export async function fetchEstudiantesProfesor(_profesorId: string): Promise<Estudiante[]> {
  return fetchEstudiantes(true);
}

// ✨ OPTIMIZADO: Solo infracciones del profesor con límite
export async function fetchInfraccionesProfesor(
  profesorId: string,
  limit = 100,
): Promise<Infraccion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('infracciones')
    .select(INF_SELECT)
    .eq('registrado_por', profesorId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('fetchInfraccionesProfesor:', error);
    return [];
  }
  return (data ?? []).map(mapInfraccion);
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

export async function updateInfraccion(
  id: string,
  payload: { tipo_falta_id: string; fecha: string; descripcion: string },
): Promise<string | null> {
  const supabase = createClient();
  const { error } = await supabase.from('infracciones').update(payload).eq('id', id);
  return error?.message ?? null;
}

export async function deleteInfraccion(id: string): Promise<string | null> {
  // El borrado definitivo lo hace la API route (service_role bypasa RLS)
  const res = await fetch('/api/admin/eliminar-infraccion', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ infraccionId: id }),
  });
  const json = await res.json();
  return json.ok ? null : (json.error ?? 'Error desconocido');
}
// ============================================
// FUNCIONES CORREGIDAS PARA lib/data.ts
// COPIAR AL FINAL DEL ARCHIVO (después de deleteInfraccion)
// ============================================

/**
 * Fetch infracciones con paginación para el dashboard del REGENTE
 * Incluye filtros por gravedad, tipo y búsqueda
 */
export async function fetchInfraccionesRegentePaginadas(
  page = 1,
  limit = 50,
  filters?: {
    gravedad?: string;
    tipo?: string;
    search?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  },
): Promise<{ data: Infraccion[]; total: number; hasMore: boolean }> {
  const supabase = createClient(); // ✅ CORREGIDO
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('infracciones')
    .select(INF_SELECT, { count: 'exact' })
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  // Aplicar filtros
  if (filters?.tipo && filters.tipo !== 'all') {
    query = query.eq('tipo_falta_id', filters.tipo);
  }

  if (filters?.search) {
    // El filtro de búsqueda se aplicará después en cliente
  }

  if (filters?.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde);
  }

  if (filters?.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching infracciones regente:', error);
    return { data: [], total: 0, hasMore: false };
  }

  let infracciones = (data ?? []).map(mapInfraccion);

  // Filtrado en cliente (gravedad y búsqueda)
  if (filters?.gravedad && filters.gravedad !== 'all') {
    infracciones = infracciones.filter((inf) => inf.tipo_falta?.gravedad === filters.gravedad);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    infracciones = infracciones.filter(
      (inf) =>
        inf.estudiante?.nombre_completo.toLowerCase().includes(searchLower) ||
        inf.descripcion.toLowerCase().includes(searchLower),
    );
  }

  const total = count ?? 0;
  const hasMore = to < total - 1;

  return { data: infracciones, total, hasMore };
}

/**
 * Fetch infracciones con paginación para el dashboard del PROFESOR
 * Solo muestra las infracciones registradas por ese profesor
 */
export async function fetchInfraccionesProfesorPaginadas(
  profesorId: string,
  page = 1,
  limit = 50,
  filters?: {
    gravedad?: string;
    curso?: string;
    search?: string;
  },
): Promise<{ data: Infraccion[]; total: number; hasMore: boolean }> {
  const supabase = createClient(); // ✅ CORREGIDO
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('infracciones')
    .select(INF_SELECT, { count: 'exact' })
    .eq('registrado_por', profesorId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching infracciones profesor:', error);
    return { data: [], total: 0, hasMore: false };
  }

  let infracciones = (data ?? []).map(mapInfraccion);

  // Filtrado en cliente (gravedad, curso y búsqueda)
  if (filters?.gravedad && filters.gravedad !== 'all') {
    infracciones = infracciones.filter((inf) => inf.tipo_falta?.gravedad === filters.gravedad);
  }

  if (filters?.curso && filters.curso !== 'all') {
    infracciones = infracciones.filter((inf) => inf.estudiante?.curso === filters.curso);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    infracciones = infracciones.filter(
      (inf) =>
        inf.estudiante?.nombre_completo.toLowerCase().includes(searchLower) ||
        inf.descripcion.toLowerCase().includes(searchLower),
    );
  }

  const total = count ?? 0;
  const hasMore = to < total - 1;

  return { data: infracciones, total, hasMore };
}

/**
 * Fetch estudiantes con paginación para el modal de REGISTRAR INFRACCIÓN
 * Usado por profesores y regente al buscar estudiante
 */
export async function fetchEstudiantesModalPaginados(
  page = 1,
  limit = 30,
  filters?: {
    curso?: string;
    seccion?: string;
    search?: string;
  },
): Promise<{ data: Estudiante[]; total: number; hasMore: boolean }> {
  const supabase = createClient(); // ✅ CORREGIDO
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('estudiantes')
    .select('*', { count: 'exact' })
    .eq('activo', true)
    .order('nombre_completo', { ascending: true });

  // Aplicar filtros
  if (filters?.curso && filters.curso !== 'all') {
    query = query.eq('curso', filters.curso);
  }

  if (filters?.seccion && filters.seccion !== 'all') {
    query = query.eq('seccion', filters.seccion);
  }

  if (filters?.search && filters.search.length >= 2) {
    query = query.ilike('nombre_completo', `%${filters.search}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching estudiantes modal:', error);
    return { data: [], total: 0, hasMore: false };
  }

  const total = count ?? 0;
  const hasMore = to < total - 1;

  return { data: (data ?? []) as Estudiante[], total, hasMore };
}

/**
 * Fetch infracciones con paginación para el dashboard de ADMIN
 * Vista completa con todos los filtros posibles
 */
export async function fetchInfraccionesAdminPaginadas(
  page = 1,
  limit = 50,
  filters?: {
    gravedad?: string;
    tipo?: string;
    curso?: string;
    registrador?: string;
    search?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  },
): Promise<{ data: Infraccion[]; total: number; hasMore: boolean }> {
  const supabase = createClient(); // ✅ CORREGIDO
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('infracciones')
    .select(INF_SELECT, { count: 'exact' })
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  // Aplicar filtros en BD
  if (filters?.tipo && filters.tipo !== 'all') {
    query = query.eq('tipo_falta_id', filters.tipo);
  }

  if (filters?.registrador && filters.registrador !== 'all') {
    query = query.eq('registrado_por', filters.registrador);
  }

  if (filters?.fechaDesde) {
    query = query.gte('fecha', filters.fechaDesde);
  }

  if (filters?.fechaHasta) {
    query = query.lte('fecha', filters.fechaHasta);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching infracciones admin:', error);
    return { data: [], total: 0, hasMore: false };
  }

  let infracciones = (data ?? []).map(mapInfraccion);

  // Filtrado en cliente (gravedad, curso y búsqueda)
  if (filters?.gravedad && filters.gravedad !== 'all') {
    infracciones = infracciones.filter((inf) => inf.tipo_falta?.gravedad === filters.gravedad);
  }

  if (filters?.curso && filters.curso !== 'all') {
    infracciones = infracciones.filter((inf) => inf.estudiante?.curso === filters.curso);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    infracciones = infracciones.filter(
      (inf) =>
        inf.estudiante?.nombre_completo.toLowerCase().includes(searchLower) ||
        inf.descripcion.toLowerCase().includes(searchLower),
    );
  }

  const total = count ?? 0;
  const hasMore = to < total - 1;

  return { data: infracciones, total, hasMore };
}
