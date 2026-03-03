import type {
  Usuario,
  Estudiante,
  TipoFalta,
  Infraccion,
  PadreEstudiante,
} from "./types"

// Mock Users
export const mockUsuarios: Usuario[] = [
  {
    id: "u1",
    email: "admin@colegiodorado.edu",
    nombre_completo: "Carlos Mendoza",
    rol: "admin",
    avatar_url: null,
    created_at: "2024-01-15T08:00:00Z",
  },
  {
    id: "u2",
    email: "prof.garcia@colegiodorado.edu",
    nombre_completo: "María García",
    rol: "profesor",
    avatar_url: null,
    created_at: "2024-02-01T09:00:00Z",
  },
  {
    id: "u3",
    email: "prof.lopez@colegiodorado.edu",
    nombre_completo: "Juan López",
    rol: "profesor",
    avatar_url: null,
    created_at: "2024-02-10T10:00:00Z",
  },
  {
    id: "u4",
    email: "prof.martinez@colegiodorado.edu",
    nombre_completo: "Ana Martínez",
    rol: "profesor",
    avatar_url: null,
    created_at: "2024-03-05T11:00:00Z",
  },
  {
    id: "u5",
    email: "padre.rodriguez@gmail.com",
    nombre_completo: "Pedro Rodríguez",
    rol: "padre",
    avatar_url: null,
    created_at: "2024-03-10T12:00:00Z",
  },
  {
    id: "u6",
    email: "padre.sanchez@gmail.com",
    nombre_completo: "Laura Sánchez",
    rol: "padre",
    avatar_url: null,
    created_at: "2024-03-15T13:00:00Z",
  },
  {
    id: "u7",
    email: "padre.herrera@gmail.com",
    nombre_completo: "Roberto Herrera",
    rol: "padre",
    avatar_url: null,
    created_at: "2024-04-01T14:00:00Z",
  },
]

// Mock Students
export const mockEstudiantes: Estudiante[] = [
  {
    id: "e1",
    nombre_completo: "Alejandro Rodríguez",
    curso: "4to",
    seccion: "A",
    fecha_nacimiento: "2008-05-15",
    direccion: "Calle 45 #12-34, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e2",
    nombre_completo: "Valentina Sánchez",
    curso: "3ro",
    seccion: "B",
    fecha_nacimiento: "2009-08-22",
    direccion: "Av. Libertador 567, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e3",
    nombre_completo: "Santiago Herrera",
    curso: "5to",
    seccion: "A",
    fecha_nacimiento: "2007-11-03",
    direccion: "Carrera 10 #45-67, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e4",
    nombre_completo: "Isabella Torres",
    curso: "4to",
    seccion: "B",
    fecha_nacimiento: "2008-03-18",
    direccion: "Calle 72 #89-12, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e5",
    nombre_completo: "Mateo Gómez",
    curso: "6to",
    seccion: "A",
    fecha_nacimiento: "2006-07-25",
    direccion: "Transversal 3 #15-28, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e6",
    nombre_completo: "Luciana Vargas",
    curso: "2do",
    seccion: "A",
    fecha_nacimiento: "2010-12-01",
    direccion: "Diagonal 56 #78-90, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e7",
    nombre_completo: "Daniel Morales",
    curso: "1ro",
    seccion: "B",
    fecha_nacimiento: "2011-04-10",
    direccion: "Calle 100 #23-45, Bogotá",
    foto_url: null,
    activo: false,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e8",
    nombre_completo: "Camila Ruiz",
    curso: "3ro",
    seccion: "A",
    fecha_nacimiento: "2009-09-14",
    direccion: "Av. Boyacá 34-56, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e9",
    nombre_completo: "Sebastián Castro",
    curso: "5to",
    seccion: "B",
    fecha_nacimiento: "2007-06-30",
    direccion: "Carrera 7 #132-45, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
  {
    id: "e10",
    nombre_completo: "Sofía Ramírez",
    curso: "4to",
    seccion: "A",
    fecha_nacimiento: "2008-01-28",
    direccion: "Calle 26 #67-89, Bogotá",
    foto_url: null,
    activo: true,
    created_at: "2024-01-20T08:00:00Z",
  },
]

// Mock Fault Types
export const mockTiposFalta: TipoFalta[] = [
  {
    id: "tf1",
    nombre: "Llegada tardía",
    descripcion: "El estudiante llega después de la hora establecida de inicio de clases",
    gravedad: "leve",
    color: "#22c55e",
  },
  {
    id: "tf2",
    nombre: "Uso de celular",
    descripcion: "Uso no autorizado de dispositivos móviles durante clase",
    gravedad: "leve",
    color: "#22c55e",
  },
  {
    id: "tf3",
    nombre: "Uniforme incompleto",
    descripcion: "No portar el uniforme escolar completo según el reglamento",
    gravedad: "leve",
    color: "#22c55e",
  },
  {
    id: "tf4",
    nombre: "Conducta disruptiva",
    descripcion: "Comportamiento que interrumpe el normal desarrollo de la clase",
    gravedad: "grave",
    color: "#eab308",
  },
  {
    id: "tf5",
    nombre: "Copia en examen",
    descripcion: "Fraude académico durante evaluaciones",
    gravedad: "grave",
    color: "#eab308",
  },
  {
    id: "tf6",
    nombre: "Daño a propiedad",
    descripcion: "Deterioro intencional de instalaciones o materiales del colegio",
    gravedad: "grave",
    color: "#eab308",
  },
  {
    id: "tf7",
    nombre: "Agresión física",
    descripcion: "Violencia física contra otro estudiante o miembro del personal",
    gravedad: "muy_grave",
    color: "#ef4444",
  },
  {
    id: "tf8",
    nombre: "Bullying",
    descripcion: "Acoso sistemático hacia otro estudiante",
    gravedad: "muy_grave",
    color: "#ef4444",
  },
]

// Mock Parent-Student links
export const mockPadresEstudiantes: PadreEstudiante[] = [
  { id: "pe1", usuario_id: "u5", estudiante_id: "e1" },
  { id: "pe2", usuario_id: "u5", estudiante_id: "e4" },
  { id: "pe3", usuario_id: "u6", estudiante_id: "e2" },
  { id: "pe4", usuario_id: "u7", estudiante_id: "e3" },
  { id: "pe5", usuario_id: "u7", estudiante_id: "e5" },
]

// Mock Infractions
export const mockInfracciones: Infraccion[] = [
  {
    id: "i1",
    estudiante_id: "e1",
    profesor_id: "u2",
    tipo_falta_id: "tf1",
    fecha: "2024-11-05",
    descripcion:
      "El estudiante llegó 20 minutos tarde a la primera hora de clase sin justificación válida.",
    sancion: "Nota en el observador del estudiante",
    estado: "resuelto",
    created_at: "2024-11-05T07:20:00Z",
  },
  {
    id: "i2",
    estudiante_id: "e3",
    profesor_id: "u3",
    tipo_falta_id: "tf4",
    fecha: "2024-11-08",
    descripcion:
      "Interrumpió repetidamente la clase de matemáticas haciendo ruidos y molestando a sus compañeros.",
    sancion: "Citación a padres de familia",
    estado: "pendiente",
    created_at: "2024-11-08T10:30:00Z",
  },
  {
    id: "i3",
    estudiante_id: "e2",
    profesor_id: "u2",
    tipo_falta_id: "tf2",
    fecha: "2024-11-10",
    descripcion:
      "Se encontró a la estudiante usando el celular durante el examen de ciencias naturales.",
    sancion: "Decomiso del dispositivo y nota en el observador",
    estado: "resuelto",
    created_at: "2024-11-10T09:15:00Z",
  },
  {
    id: "i4",
    estudiante_id: "e5",
    profesor_id: "u4",
    tipo_falta_id: "tf7",
    fecha: "2024-11-12",
    descripcion:
      "El estudiante inició una pelea en el patio durante el recreo, causando lesiones menores a un compañero.",
    sancion: "Suspensión de 3 días y proceso disciplinario",
    estado: "apelado",
    created_at: "2024-11-12T11:45:00Z",
  },
  {
    id: "i5",
    estudiante_id: "e4",
    profesor_id: "u3",
    tipo_falta_id: "tf5",
    fecha: "2024-11-15",
    descripcion:
      "Se descubrió que la estudiante copiaba de un compañero durante el examen de historia.",
    sancion: "Anulación del examen y nota de 1.0",
    estado: "resuelto",
    created_at: "2024-11-15T14:20:00Z",
  },
  {
    id: "i6",
    estudiante_id: "e1",
    profesor_id: "u4",
    tipo_falta_id: "tf3",
    fecha: "2024-11-18",
    descripcion:
      "El estudiante se presentó sin la camiseta del uniforme reglamentario por segunda vez en la semana.",
    sancion: "Nota en el observador y citación",
    estado: "pendiente",
    created_at: "2024-11-18T07:05:00Z",
  },
  {
    id: "i7",
    estudiante_id: "e8",
    profesor_id: "u2",
    tipo_falta_id: "tf8",
    fecha: "2024-11-20",
    descripcion:
      "Se reportaron múltiples incidentes de acoso verbal hacia una compañera de clase durante varias semanas.",
    sancion: "Suspensión de 5 días y acompañamiento psicológico obligatorio",
    estado: "pendiente",
    created_at: "2024-11-20T16:00:00Z",
  },
  {
    id: "i8",
    estudiante_id: "e9",
    profesor_id: "u3",
    tipo_falta_id: "tf6",
    fecha: "2024-11-22",
    descripcion:
      "El estudiante rayó intencionalmente las paredes del salón de clases con marcador permanente.",
    sancion: "Reparación del daño y trabajo comunitario",
    estado: "resuelto",
    created_at: "2024-11-22T13:30:00Z",
  },
  {
    id: "i9",
    estudiante_id: "e10",
    profesor_id: "u4",
    tipo_falta_id: "tf1",
    fecha: "2024-11-25",
    descripcion:
      "La estudiante llegó 15 minutos tarde después del cambio de hora, sin justificación.",
    sancion: "Anotación en el observador",
    estado: "resuelto",
    created_at: "2024-11-25T08:15:00Z",
  },
  {
    id: "i10",
    estudiante_id: "e6",
    profesor_id: "u2",
    tipo_falta_id: "tf4",
    fecha: "2024-11-28",
    descripcion:
      "La estudiante se negó a seguir instrucciones y respondió de manera irrespetuosa a la profesora.",
    sancion: "Citación a padres y compromiso de comportamiento",
    estado: "pendiente",
    created_at: "2024-11-28T10:00:00Z",
  },
]

// Helper to get joined infraction data
export function getInfraccionesConDatos(): Infraccion[] {
  return mockInfracciones.map((inf) => ({
    ...inf,
    estudiante: mockEstudiantes.find((e) => e.id === inf.estudiante_id),
    profesor: mockUsuarios.find((u) => u.id === inf.profesor_id),
    tipo_falta: mockTiposFalta.find((tf) => tf.id === inf.tipo_falta_id),
  }))
}

export function getEstudianteInfracciones(estudianteId: string): Infraccion[] {
  return getInfraccionesConDatos().filter(
    (inf) => inf.estudiante_id === estudianteId
  )
}

export function getHijosDelPadre(padreId: string): Estudiante[] {
  const links = mockPadresEstudiantes.filter((pe) => pe.usuario_id === padreId)
  return links
    .map((link) =>
      mockEstudiantes.find((e) => e.id === link.estudiante_id)
    )
    .filter(Boolean) as Estudiante[]
}
