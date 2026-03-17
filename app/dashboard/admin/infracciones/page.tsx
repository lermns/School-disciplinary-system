"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { fetchInfracciones, fetchEstudiantes, fetchTiposFalta, createInfraccion, deleteInfraccion } from "@/lib/data"
import { getGravedadConfig, formatDate, todayISO } from "@/lib/helpers"
import { useAuth } from "@/lib/auth-context"
import { useDebounce } from "@/lib/use-debounce"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, Filter, Plus, BookOpen, CalendarDays, FileText, CheckCircle2, ChevronDown, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Infraccion, Estudiante, TipoFalta } from "@/lib/types"

const CURSOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const SECCIONES = ["A", "B", "C"]

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

/** Normaliza texto: minúsculas + sin tildes */
function normalize(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

/**
 * Devuelve true si CADA término de búsqueda coincide con el
 * inicio de ALGUNA palabra del nombre del estudiante.
 * Ej: "an ma" → match "Ana María López" ✓
 */
function matchesSearch(nombre: string, query: string): boolean {
  if (!query.trim()) return true
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  const words = normalize(nombre).split(/\s+/)
  return terms.every(term => words.some(word => word.startsWith(term)))
}

// ─────────────────────────────────────────────────────────────
// Modal "Nueva Infracción" (SIN CAMBIOS)
// ─────────────────────────────────────────────────────────────
function NuevaInfraccionModal({
  open, onClose, onCreated, adminId, estudiantes, tiposFalta, todasInfracciones,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  adminId: string
  estudiantes: Estudiante[]
  tiposFalta: TipoFalta[]
  todasInfracciones: Infraccion[]
}) {
  // ── Filtros de estudiante ──────────────────────────────────
  const [filterCurso, setFilterCurso] = useState("")
  const [filterSeccion, setFilterSeccion] = useState("")
  const [search, setSearch] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // ── Infracción ─────────────────────────────────────────────
  const [estudianteId, setEstudianteId] = useState("")
  const [tipoFaltaId, setTipoFaltaId] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fecha, setFecha] = useState(todayISO())
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Refs para cerrar dropdown con clic fuera ───────────────
  const searchContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // ── Estudiantes filtrados por curso / sección / búsqueda ───
  const estudiantesBase = useMemo(() =>
    estudiantes.filter(e => {
      if (!e.activo) return false
      if (filterCurso && e.curso !== filterCurso) return false
      if (filterSeccion && e.seccion !== filterSeccion) return false
      return true
    }),
    [estudiantes, filterCurso, filterSeccion]
  )

  const estudiantesVisibles = useMemo(() =>
    estudiantesBase.filter(e => matchesSearch(e.nombre_completo, search)),
    [estudiantesBase, search]
  )

  const estudianteSeleccionado = useMemo(
    () => estudiantes.find(e => e.id === estudianteId) ?? null,
    [estudiantes, estudianteId]
  )

  // ── Validación duplicado falta leve ───────────────────────
  const levesDuplicadasEnFecha = useMemo(() => {
    if (!estudianteId || !fecha) return new Set<string>()
    return new Set(
      todasInfracciones
        .filter(i => i.estudiante_id === estudianteId && i.fecha === fecha && i.tipo_falta?.gravedad === "leve")
        .map(i => i.tipo_falta_id)
    )
  }, [estudianteId, fecha, todasInfracciones])

  const tipoSeleccionado = tiposFalta.find(tf => tf.id === tipoFaltaId)
  const esDuplicadoLeve = !!tipoFaltaId && tipoSeleccionado?.gravedad === "leve" && levesDuplicadasEnFecha.has(tipoFaltaId)
  const canSubmit = !!estudianteId && !!tipoFaltaId && !!fecha && !esDuplicadoLeve && !saving

  // ── Handlers ──────────────────────────────────────────────
  const seleccionarEstudiante = (est: Estudiante) => {
    setEstudianteId(est.id)
    setSearch(est.nombre_completo)
    setDropdownOpen(false)
    setTipoFaltaId("")
  }

  const limpiarEstudiante = () => {
    setEstudianteId("")
    setSearch("")
    setTipoFaltaId("")
    setDropdownOpen(false)
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    const error = await createInfraccion({
      estudiante_id: estudianteId,
      registrado_por: adminId,
      tipo_falta_id: tipoFaltaId,
      fecha,
      descripcion,
    })
    setSaving(false)
    if (error) { toast.error("Error al registrar: " + error); return }
    setSuccess(true)
  }

  const cerrar = () => {
    // Reset todo
    setFilterCurso(""); setFilterSeccion(""); setSearch(""); setDropdownOpen(false)
    setEstudianteId(""); setTipoFaltaId(""); setDescripcion(""); setFecha(todayISO())
    setSuccess(false)
    onClose()
    if (success) onCreated()
  }

  // ─────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar nueva infracción</DialogTitle>
        </DialogHeader>

        {success ? (
          /* ── Pantalla de éxito ── */
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <p className="font-semibold text-foreground">¡Infracción registrada!</p>
            <p className="text-sm text-muted-foreground">
              La falta de <strong>{estudianteSeleccionado?.nombre_completo}</strong> ha sido guardada correctamente.
            </p>
            <Button onClick={cerrar} className="mt-2 w-full bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">

            {/* ── 1. Curso ── */}
            <div className="space-y-1.5">
              <Label>Curso</Label>
              <Select
                value={filterCurso || "all"}
                onValueChange={v => {
                  setFilterCurso(v === "all" ? "" : v)
                  limpiarEstudiante()
                }}
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Todos los cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">Todos los cursos</SelectItem>
                  {CURSOS.map(c => <SelectItem key={c} value={c} className="cursor-pointer">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* ── 2. Sección ── */}
            <div className="space-y-1.5">
              <Label>Sección</Label>
              <Select
                value={filterSeccion || "all"}
                onValueChange={v => {
                  setFilterSeccion(v === "all" ? "" : v)
                  limpiarEstudiante()
                }}
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Todas las secciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="cursor-pointer">Todas las secciones</SelectItem>
                  {SECCIONES.map(s => <SelectItem key={s} value={s} className="cursor-pointer">Sección {s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* ── 3. Estudiante (búsqueda con dropdown flotante) ── */}
            <div className="space-y-1.5">
              <Label>
                Estudiante <span className="text-destructive">*</span>
              </Label>

              <div ref={searchContainerRef} className="relative">
                {/* Input de búsqueda */}
                <div className="relative flex items-center">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar por nombre, iniciales..."
                    value={search}
                    onChange={e => {
                      setSearch(e.target.value)
                      if (!estudianteId) setDropdownOpen(true)
                      else {
                        // Si edita el campo con un estudiante seleccionado, lo deselecciona
                        setEstudianteId("")
                        setTipoFaltaId("")
                        setDropdownOpen(true)
                      }
                    }}
                    onFocus={() => {
                      if (!estudianteId) setDropdownOpen(true)
                    }}
                    className={`pl-9 ${estudianteId ? "pr-8" : ""}`}
                    autoComplete="off"
                  />
                  {/* Botón limpiar selección */}
                  {estudianteId && (
                    <button
                      type="button"
                      onClick={limpiarEstudiante}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>

                {/* Chip de estudiante seleccionado */}
                {estudianteId && estudianteSeleccionado && (
                  <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {getInitials(estudianteSeleccionado.nombre_completo)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{estudianteSeleccionado.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">{estudianteSeleccionado.curso} — Sección {estudianteSeleccionado.seccion}</p>
                    </div>
                  </div>
                )}

                {/* ── Dropdown flotante ── */}
                {dropdownOpen && !estudianteId && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-popover border rounded-lg shadow-lg overflow-hidden"
                    style={{ maxHeight: "min(280px, calc(100dvh - 300px))" }}>
                    <div className="overflow-y-auto" style={{ maxHeight: "inherit" }}>
                      {estudiantesVisibles.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-3 text-center">
                          {estudiantesBase.length === 0
                            ? "No hay estudiantes en el curso/sección seleccionado"
                            : "Sin resultados para la búsqueda"}
                        </p>
                      ) : (
                        estudiantesVisibles.map(e => (
                          <button
                            key={e.id}
                            type="button"
                            onMouseDown={ev => { ev.preventDefault(); seleccionarEstudiante(e) }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                          >
                            <Avatar className="size-7 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                {getInitials(e.nombre_completo)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{e.nombre_completo}</p>
                              <p className="text-xs text-muted-foreground">{e.curso} — Sección {e.seccion}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── 4. Fecha ── */}
            <div className="space-y-1.5">
              <Label>Fecha <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={fecha}
                onChange={e => { setFecha(e.target.value); setTipoFaltaId("") }}
                max={todayISO()}
              />
            </div>

            {/* ── 5. Tipo de falta ── */}
            <div className="space-y-1.5">
              <Label>Tipo de falta <span className="text-destructive">*</span></Label>
              <Select value={tipoFaltaId} onValueChange={setTipoFaltaId}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Selecciona un tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposFalta.map(tf => {
                    const g = getGravedadConfig(tf.gravedad)
                    const bloqueado = tf.gravedad === "leve" && !!estudianteId && levesDuplicadasEnFecha.has(tf.id)
                    return (
                      <SelectItem key={tf.id} value={tf.id} disabled={bloqueado} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: tf.color }} />
                          <span className={bloqueado ? "line-through text-muted-foreground" : ""}>{tf.nombre}</span>
                          <span className={`ml-1 text-xs ${g.className} px-1.5 py-0.5 rounded border`}>{g.label}</span>
                          {bloqueado && <span className="text-xs text-muted-foreground">(ya registrado)</span>}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {esDuplicadoLeve && (
                <p className="text-xs text-destructive font-medium">
                  Esta falta leve ya fue registrada el {fecha === todayISO() ? "día de hoy" : formatDate(fecha)} para este estudiante.
                </p>
              )}
            </div>

            {/* ── 6. Descripción ── */}
            <div className="space-y-1.5">
              <Label>
                Descripción <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
              </Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                rows={3}
              />
            </div>

            {/* ── Botones ── */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={cerrar} className="flex-1 cursor-pointer">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="cursor-pointer flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white"
              >
                {saving ? "Guardando..." : "Registrar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// ✨ Página principal - CON OPTIMIZACIÓN INTELIGENTE
// ─────────────────────────────────────────────────────────────
export default function AdminInfraccionesPage() {
  const { user } = useAuth()
  const [infracciones, setInfracciones] = useState<Infraccion[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [tiposFalta, setTiposFalta] = useState<TipoFalta[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de filtros
  const [search, setSearch] = useState("")
  const [filterGravedad, setFilterGravedad] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")

  // Estados de UI
  const [selected, setSelected] = useState<Infraccion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDeleteInf, setConfirmDeleteInf] = useState<Infraccion | null>(null)
  const [deletingInf, setDeletingInf] = useState(false)

  // ✨ OPTIMIZACIÓN: Debounce del search
  const debouncedSearch = useDebounce(search, 400)

  // ✨ OPTIMIZACIÓN: Detectar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return debouncedSearch.trim() !== ""
      || filterGravedad !== "all"
      || filterTipo !== "all"
  }, [debouncedSearch, filterGravedad, filterTipo])

  const cargarDatos = useCallback(async () => {
    setLoading(true)

    // ✨ ESTRATEGIA INTELIGENTE:
    // - Sin filtros → Solo últimas 50 infracciones (carga rápida)
    // - Con filtros → Cargar más para poder filtrar mejor (500 máx)
    const limit = hasActiveFilters ? 500 : 50

    const [infs, ests, tipos] = await Promise.all([
      fetchInfracciones(limit),
      fetchEstudiantes(),
      fetchTiposFalta(),
    ])

    setInfracciones(infs)
    setEstudiantes(ests)
    setTiposFalta(tipos)
    setLoading(false)
  }, [hasActiveFilters])

  // ✨ OPTIMIZACIÓN: Recargar solo cuando cambian los filtros
  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Filtrado en cliente (igual que antes)
  const filtered = useMemo(() => infracciones.filter(inf => {
    const matchSearch = !debouncedSearch
      || inf.estudiante?.nombre_completo.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inf.tipo_falta?.nombre.toLowerCase().includes(debouncedSearch.toLowerCase())
      || inf.descripcion.toLowerCase().includes(debouncedSearch.toLowerCase())
    return matchSearch
      && (filterGravedad === "all" || inf.tipo_falta?.gravedad === filterGravedad)
      && (filterTipo === "all" || inf.tipo_falta_id === filterTipo)
  }), [infracciones, debouncedSearch, filterGravedad, filterTipo])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando infracciones...</div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Infracciones</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {/* ✨ INDICADOR INTELIGENTE */}
            {hasActiveFilters
              ? `${filtered.length} de ${infracciones.length} infracciones`
              : `${infracciones.length} infracciones más recientes`}
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="gap-2 bg-[#0f1f3d] hover:bg-[#1a3461] text-white shrink-0 cursor-pointer"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nueva infracción</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* ✨ Input de búsqueda con indicador de debounce */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por estudiante, tipo o descripción..."
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

        <Select value={filterGravedad} onValueChange={setFilterGravedad}>
          <SelectTrigger className="w-full sm:w-44 cursor-pointer">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Gravedad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="leve">Leve</SelectItem>
            <SelectItem value="grave">Grave</SelectItem>
            <SelectItem value="muy_grave">Muy Grave</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTipo} onValueChange={setFilterTipo}>
          <SelectTrigger className="w-full sm:w-52 cursor-pointer">
            <SelectValue placeholder="Tipo de falta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {tiposFalta.map(tf => <SelectItem key={tf.id} value={tf.id}>{tf.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="font-semibold text-gray-700">Estudiante</TableHead>
              <TableHead className="font-semibold text-gray-700">Curso</TableHead>
              <TableHead className="font-semibold text-gray-700">Tipo de Falta</TableHead>
              <TableHead className="font-semibold text-gray-700">Gravedad</TableHead>
              <TableHead className="font-semibold text-gray-700 hidden md:table-cell">Registrado por</TableHead>
              <TableHead className="font-semibold text-gray-700">Fecha</TableHead>
              <TableHead className="font-semibold text-gray-700 hidden lg:table-cell">Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  {infracciones.length === 0
                    ? "No hay infracciones registradas aún"
                    : "No se encontraron infracciones con los filtros seleccionados"}
                </TableCell>
              </TableRow>
            ) : filtered.map(inf => {
              const g = getGravedadConfig(inf.tipo_falta!.gravedad)
              return (
                <TableRow
                  key={inf.id}
                  className="hover:bg-gray-300/50 transition-colors cursor-pointer"
                  onClick={() => setSelected(inf)}
                >
                  <TableCell className="font-medium text-gray-900">{inf.estudiante?.nombre_completo}</TableCell>
                  <TableCell className="text-gray-600 text-sm">{inf.estudiante?.curso} {inf.estudiante?.seccion}</TableCell>
                  <TableCell className="text-gray-700">{inf.tipo_falta?.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${g.className}`}>{g.label}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm hidden md:table-cell">
                    {inf.regente?.rol === "admin"
                      ? <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">Admin</Badge>
                      : inf.regente?.rol === "profesor"
                        ? <Badge variant="outline" className="text-[10px] px-1 py-0 bg-indigo-50 text-indigo-700 border-indigo-200">
                          Prof. {inf.regente.nombre_completo.split(" ")[0]}
                        </Badge>
                        : <Badge variant="outline" className="text-[10px] px-1 py-0 bg-purple-50 text-purple-600 border-purple-200">Regente</Badge>}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm whitespace-nowrap">{formatDate(inf.fecha)}</TableCell>
                  <TableCell className="text-gray-600 text-sm max-w-xs hidden lg:table-cell">
                    <span className="line-clamp-2">{inf.descripcion}</span>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog detalle (SIN CAMBIOS) */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base">Detalle de infracción</DialogTitle>
              <Button
                variant="ghost" size="icon"
                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                onClick={() => { setConfirmDeleteInf(selected); setSelected(null) }}
                title="Eliminar infracción"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </DialogHeader>
          {selected && (() => {
            const g = selected.tipo_falta ? getGravedadConfig(selected.tipo_falta.gravedad) : null
            return (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {selected.estudiante ? getInitials(selected.estudiante.nombre_completo) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{selected.estudiante?.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">{selected.estudiante?.curso} — Sección {selected.estudiante?.seccion}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo de falta</p>
                      <p className="font-medium">{selected.tipo_falta?.nombre ?? "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha</p>
                      <p className="font-medium">{formatDate(selected.fecha)}</p>
                    </div>
                  </div>
                </div>
                {g && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Gravedad:</span>
                    <Badge variant="outline" className={g.className}>{g.label}</Badge>
                  </div>
                )}
                {selected.regente && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">Registrado por:</span>
                    {selected.regente.rol === "admin"
                      ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-200">Admin</Badge>
                      : selected.regente.rol === "profesor"
                        ? <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-indigo-50 text-indigo-700 border-indigo-200">
                          Prof. {selected.regente.nombre_completo.split(" ")[0]}
                        </Badge>
                        : <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-600 border-purple-200">Regente</Badge>}
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm leading-relaxed">{selected.descripcion || "Sin descripción."}</p>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminar infracción (SIN CAMBIOS) */}
      <AlertDialog open={!!confirmDeleteInf} onOpenChange={open => !open && setConfirmDeleteInf(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />Eliminar infracción
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                ¿Estás seguro de que deseas eliminar la infracción de{" "}
                <strong>{confirmDeleteInf?.estudiante?.nombre_completo}</strong>?
                <br />
                <span className="font-medium">{confirmDeleteInf?.tipo_falta?.nombre}</span>
                {confirmDeleteInf?.fecha && <> — {formatDate(confirmDeleteInf.fecha)}</>}
                <br /><br />
                <span className="font-semibold text-destructive">Esta acción no se puede deshacer.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingInf}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingInf}
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={async () => {
                if (!confirmDeleteInf) return
                setDeletingInf(true)
                const error = await deleteInfraccion(confirmDeleteInf.id)
                setDeletingInf(false)
                if (error) { toast.error("Error: " + error); return }
                toast.success("Infracción eliminada")
                setConfirmDeleteInf(null)
                cargarDatos()
              }}
            >
              {deletingInf ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NuevaInfraccionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={cargarDatos}
        adminId={user?.id ?? ""}
        estudiantes={estudiantes}
        tiposFalta={tiposFalta}
        todasInfracciones={infracciones}
      />
    </div>
  )
}