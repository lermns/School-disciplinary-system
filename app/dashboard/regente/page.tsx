"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { fetchEstudiantes, fetchTiposFalta, fetchInfracciones } from "@/lib/data"
import type { Estudiante, TipoFalta, Infraccion } from "@/lib/types"
import { useDebounce } from "@/lib/use-debounce"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Clock, Users, AlertTriangle, ChevronDown } from "lucide-react"
import { RegistrarInfraccionModal } from "@/components/regente/registrar-infraccion-modal"
import { useAuth } from "@/lib/auth-context"
import { getGravedadConfig } from "@/lib/helpers"

const CURSOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const SECCIONES = ["A", "B", "C"]

export default function RegenteDashboard() {
  const { user } = useAuth()
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [tiposDisponibles, setTiposDisponibles] = useState<TipoFalta[]>([])
  const [todasInfracciones, setTodasInfracciones] = useState<Infraccion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCurso, setFilterCurso] = useState("all")
  const [filterSeccion, setFilterSeccion] = useState("all")
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [tiposDialogOpen, setTiposDialogOpen] = useState(false)

  // ✨ NUEVO: Paginación
  const [displayLimit, setDisplayLimit] = useState(50)

  // ✨ NUEVO: Debounce del search
  const debouncedSearch = useDebounce(search, 400)

  const cargarDatos = useCallback(async () => {
    const [ests, tipos, infs] = await Promise.all([
      fetchEstudiantes(true),
      fetchTiposFalta(),
      fetchInfracciones(100), // ✨ Solo últimas 100 infracciones
    ])
    setEstudiantes(ests)
    setTiposDisponibles(tipos.filter(tf => tf.asignadoRegente && tf.gravedad === "leve"))
    setTodasInfracciones(infs)
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ✨ OPTIMIZADO: Usar debouncedSearch
  const filtered = useMemo(() => estudiantes.filter(e => {
    const matchSearch = !debouncedSearch ||
      e.nombre_completo.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.curso.toLowerCase().includes(debouncedSearch.toLowerCase())
    return matchSearch &&
      (filterCurso === "all" || e.curso === filterCurso) &&
      (filterSeccion === "all" || e.seccion === filterSeccion)
  }), [estudiantes, debouncedSearch, filterCurso, filterSeccion])

  // ✨ NUEVO: Estudiantes visibles (con límite de paginación)
  const estudiantesVisibles = useMemo(() =>
    filtered.slice(0, displayLimit),
    [filtered, displayLimit])

  const abrirModal = (est: Estudiante) => {
    setEstudianteSeleccionado(est)
    setModalOpen(true)
  }

  // ✨ NUEVO: Handler para cargar más
  const cargarMas = () => {
    setDisplayLimit(prev => prev + 50)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Panel del Regente</h1>
        <p className="text-sm text-muted-foreground">Bienvenido, registra infracciones leves.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{estudiantes.length}</p><p className="text-xs text-gray-500">Estudiantes activos</p></div>
        </div>

        <button onClick={() => setTiposDialogOpen(true)}
          className="group cursor-pointer bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-[#0f1f3d]/30 hover:shadow-md transition-all text-left">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-green-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{tiposDisponibles.length}</p><p className="text-xs text-gray-500">Tipos de falta disponibles</p></div>
        </button>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-2 md:col-span-1 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-sm font-semibold text-gray-900">Registro automático</p><p className="text-xs text-gray-500">Fecha: hoy</p></div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* ✨ Input con spinner de debounce */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar estudiante..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          {/* ✨ Spinner mientras debounce */}
          {search !== debouncedSearch && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          )}
        </div>
        <Select value={filterCurso} onValueChange={v => { setFilterCurso(v); setDisplayLimit(50) }}>
          <SelectTrigger className="w-full sm:w-44 cursor-pointer"><SelectValue placeholder="Todos los cursos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {CURSOS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeccion} onValueChange={v => { setFilterSeccion(v); setDisplayLimit(50) }}>
          <SelectTrigger className="w-full sm:w-36 cursor-pointer"><SelectValue placeholder="Sección" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Secciones</SelectItem>
            {SECCIONES.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ✨ Contador mejorado */}
      {filtered.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {filtered.length === estudiantesVisibles.length
            ? `${filtered.length} estudiante${filtered.length !== 1 ? 's' : ''}`
            : `Mostrando ${estudiantesVisibles.length} de ${filtered.length} estudiantes`
          }
        </div>
      )}

      {/* Grid de estudiantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {estudiantesVisibles.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            {estudiantes.length === 0 ? "No hay estudiantes registrados aún" : "No se encontraron estudiantes"}
          </div>
        ) : estudiantesVisibles.map(est => {
          const retrasos = todasInfracciones.filter(i => i.estudiante_id === est.id && i.tipo_falta?.nombre === "Retraso").length
          return (
            <div key={est.id} onClick={() => abrirModal(est)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-[#0f1f3d]/30 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{est.nombre_completo}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{est.curso} — Sección {est.seccion}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs bg-[#0f1f3d]/5 text-[#0f1f3d] border-[#0f1f3d]/20">Registrar falta</Badge>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <Clock className={`w-3.5 h-3.5 ${retrasos > 0 ? "text-amber-500" : "text-gray-300"}`} />
                <span className={`text-xs font-medium ${retrasos > 0 ? "text-amber-600" : "text-gray-400"}`}>
                  {retrasos === 0 ? "Sin retrasos" : `${retrasos} retraso${retrasos > 1 ? "s" : ""} acumulado${retrasos > 1 ? "s" : ""}`}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ✨ Botón "Cargar más" */}
      {estudiantesVisibles.length < filtered.length && (
        <div className="flex justify-center">
          <Button
            onClick={cargarMas}
            variant="outline"
            className="gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Mostrar 50 más ({filtered.length - estudiantesVisibles.length} restantes)
          </Button>
        </div>
      )}

      {/* Dialog de tipos de falta (SIN CAMBIOS) */}
      <Dialog open={tiposDialogOpen} onOpenChange={setTiposDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-base">Faltas disponibles para registrar</DialogTitle></DialogHeader>
          <div className="space-y-2 pt-1">
            {tiposDisponibles.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-4">No hay tipos de falta asignados al regente.</p>
              : tiposDisponibles.map(tf => {
                const g = getGravedadConfig(tf.gravedad)
                return (
                  <div key={tf.id} className="flex items-center justify-between rounded-lg border p-3 gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tf.color }} />
                      <div className="min-w-0"><p className="text-sm font-medium truncate">{tf.nombre}</p><p className="text-xs text-muted-foreground line-clamp-1">{tf.descripcion}</p></div>
                    </div>
                    <Badge variant="outline" className={`text-xs shrink-0 ${g.className}`}>{g.label}</Badge>
                  </div>
                )
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de registro (SIN CAMBIOS) */}
      {estudianteSeleccionado && (
        <RegistrarInfraccionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={cargarDatos}
          estudiante={estudianteSeleccionado}
          regenteId={user!.id}
          tiposDisponibles={tiposDisponibles}
          infraccionesEstudiante={todasInfracciones.filter(i => i.estudiante_id === estudianteSeleccionado.id)}
        />
      )}
    </div>
  )
}