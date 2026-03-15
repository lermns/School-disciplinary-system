"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchEstudiantesProfesor, fetchTiposFalta, fetchInfracciones, createInfraccion } from "@/lib/data"
import { getGravedadConfig, formatDate, todayISO } from "@/lib/helpers"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Users, FileText, CheckCircle2, BookOpen, CalendarDays, X, AlertTriangle, Clock } from "lucide-react"
import { toast } from "sonner"
import type { Estudiante, TipoFalta, Infraccion } from "@/lib/types"

const CURSOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const SECCIONES = ["A", "B", "C"]

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function normalize(str: string) {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function matchesSearch(nombre: string, query: string): boolean {
    if (!query.trim()) return true
    const terms = normalize(query).split(/\s+/).filter(Boolean)
    const words = normalize(nombre).split(/\s+/)
    return terms.every(term => words.some(word => word.startsWith(term)))
}

// ── Modal registrar infracción (igual al del admin pero filtrado al profesor) ──
function RegistrarInfraccionModal({
    open, onClose, onCreated, profesorId, estudiantes, tiposFalta, todasInfracciones,
}: {
    open: boolean; onClose: () => void; onCreated: () => void
    profesorId: string; estudiantes: Estudiante[]; tiposFalta: TipoFalta[]; todasInfracciones: Infraccion[]
}) {
    const [filterCurso, setFilterCurso] = useState("")
    const [filterSeccion, setFilterSeccion] = useState("")
    const [search, setSearch] = useState("")
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [estudianteId, setEstudianteId] = useState("")
    const [tipoFaltaId, setTipoFaltaId] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [fecha, setFecha] = useState(todayISO())
    const [success, setSuccess] = useState(false)
    const [saving, setSaving] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    // Cursos únicos disponibles en la lista de estudiantes del profesor
    const cursosDisponibles = useMemo(() => {
        const set = new Set<string>()
        estudiantes.forEach(e => set.add(e.curso))
        return CURSOS.filter(c => set.has(c))
    }, [estudiantes])

    const seccionesDisponibles = useMemo(() => {
        const set = new Set<string>()
        estudiantes.filter(e => !filterCurso || e.curso === filterCurso).forEach(e => set.add(e.seccion))
        return SECCIONES.filter(s => set.has(s))
    }, [estudiantes, filterCurso])

    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setDropdownOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    const estudiantesBase = useMemo(() =>
        estudiantes.filter(e => {
            if (!e.activo) return false
            if (filterCurso && e.curso !== filterCurso) return false
            if (filterSeccion && e.seccion !== filterSeccion) return false
            return true
        }), [estudiantes, filterCurso, filterSeccion])

    const estudiantesVisibles = useMemo(() =>
        estudiantesBase.filter(e => matchesSearch(e.nombre_completo, search)),
        [estudiantesBase, search])

    const estudianteSeleccionado = useMemo(() => estudiantes.find(e => e.id === estudianteId) ?? null, [estudiantes, estudianteId])

    const levesDuplicadasEnFecha = useMemo(() => {
        if (!estudianteId || !fecha) return new Set<string>()
        return new Set(todasInfracciones.filter(i => i.estudiante_id === estudianteId && i.fecha === fecha && i.tipo_falta?.gravedad === "leve").map(i => i.tipo_falta_id))
    }, [estudianteId, fecha, todasInfracciones])

    const tipoSeleccionado = tiposFalta.find(tf => tf.id === tipoFaltaId)
    const esDuplicadoLeve = !!tipoFaltaId && tipoSeleccionado?.gravedad === "leve" && levesDuplicadasEnFecha.has(tipoFaltaId)
    const canSubmit = !!estudianteId && !!tipoFaltaId && !!fecha && !esDuplicadoLeve && !saving

    const limpiarEstudiante = () => { setEstudianteId(""); setSearch(""); setTipoFaltaId(""); setDropdownOpen(false) }

    const seleccionarEstudiante = (est: Estudiante) => {
        setEstudianteId(est.id); setSearch(est.nombre_completo); setDropdownOpen(false); setTipoFaltaId("")
    }

    const handleSubmit = async () => {
        if (!canSubmit) return
        setSaving(true)
        const error = await createInfraccion({ estudiante_id: estudianteId, registrado_por: profesorId, tipo_falta_id: tipoFaltaId, fecha, descripcion })
        setSaving(false)
        if (error) { toast.error("Error al registrar: " + error); return }
        setSuccess(true)
    }

    const cerrar = () => {
        setFilterCurso(""); setFilterSeccion(""); setSearch(""); setDropdownOpen(false)
        setEstudianteId(""); setTipoFaltaId(""); setDescripcion(""); setFecha(todayISO()); setSuccess(false)
        onClose(); if (success) onCreated()
    }

    return (
        <Dialog open={open} onOpenChange={cerrar}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Registrar infracción</DialogTitle></DialogHeader>

                {success ? (
                    <div className="py-8 flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-green-500" /></div>
                        <p className="font-semibold">¡Infracción registrada!</p>
                        <p className="text-sm text-muted-foreground">La falta de <strong>{estudianteSeleccionado?.nombre_completo}</strong> ha sido guardada.</p>
                        <Button onClick={cerrar} className="mt-2 w-full bg-[#0f1f3d] hover:bg-[#1a3461] text-white">Cerrar</Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {/* Curso */}
                        <div className="space-y-1.5">
                            <Label>Curso</Label>
                            <Select value={filterCurso || "all"} onValueChange={v => { setFilterCurso(v === "all" ? "" : v); limpiarEstudiante() }}>
                                <SelectTrigger className="cursor-pointer w-full"><SelectValue placeholder="Todos los cursos" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos mis cursos</SelectItem>
                                    {cursosDisponibles.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Sección */}
                        <div className="space-y-1.5">
                            <Label>Sección</Label>
                            <Select value={filterSeccion || "all"} onValueChange={v => { setFilterSeccion(v === "all" ? "" : v); limpiarEstudiante() }}>
                                <SelectTrigger className="cursor-pointer w-full"><SelectValue placeholder="Todas las secciones" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las secciones</SelectItem>
                                    {seccionesDisponibles.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Estudiante */}
                        <div className="space-y-1.5">
                            <Label>Estudiante <span className="text-destructive">*</span></Label>
                            <div ref={searchRef} className="relative">
                                <div className="relative flex items-center">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        placeholder="Buscar por nombre..."
                                        value={search}
                                        onChange={e => { setSearch(e.target.value); if (!estudianteId) setDropdownOpen(true); else { setEstudianteId(""); setTipoFaltaId(""); setDropdownOpen(true) } }}
                                        onFocus={() => { if (!estudianteId) setDropdownOpen(true) }}
                                        className={`pl-9 ${estudianteId ? "pr-8" : ""}`}
                                        autoComplete="off"
                                    />
                                    {estudianteId && (
                                        <button type="button" onClick={limpiarEstudiante} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                {estudianteId && estudianteSeleccionado && (
                                    <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                                        <Avatar className="size-6 shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{getInitials(estudianteSeleccionado.nombre_completo)}</AvatarFallback></Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{estudianteSeleccionado.nombre_completo}</p>
                                            <p className="text-xs text-muted-foreground">{estudianteSeleccionado.curso} — Sección {estudianteSeleccionado.seccion}</p>
                                        </div>
                                    </div>
                                )}

                                {dropdownOpen && !estudianteId && (
                                    <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 bg-popover border rounded-lg shadow-lg overflow-hidden" style={{ maxHeight: "min(280px, calc(100dvh - 300px))" }}>
                                        <div className="overflow-y-auto" style={{ maxHeight: "inherit" }}>
                                            {estudiantesVisibles.length === 0 ? (
                                                <p className="text-xs text-muted-foreground p-3 text-center">
                                                    {estudiantesBase.length === 0 ? "No hay estudiantes en el curso/sección seleccionado" : "Sin resultados"}
                                                </p>
                                            ) : estudiantesVisibles.map(e => (
                                                <button key={e.id} type="button" onMouseDown={ev => { ev.preventDefault(); seleccionarEstudiante(e) }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/60 transition-colors text-left">
                                                    <Avatar className="size-7 shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{getInitials(e.nombre_completo)}</AvatarFallback></Avatar>
                                                    <div><p className="text-sm font-medium">{e.nombre_completo}</p><p className="text-xs text-muted-foreground">{e.curso} — Sección {e.seccion}</p></div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fecha */}
                        <div className="space-y-1.5">
                            <Label>Fecha <span className="text-destructive">*</span></Label>
                            <Input type="date" value={fecha} onChange={e => { setFecha(e.target.value); setTipoFaltaId("") }} max={todayISO()} />
                        </div>

                        {/* Tipo de falta */}
                        <div className="space-y-1.5">
                            <Label>Tipo de falta <span className="text-destructive">*</span></Label>
                            <Select value={tipoFaltaId} onValueChange={setTipoFaltaId}>
                                <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Selecciona un tipo..." /></SelectTrigger>
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
                            {esDuplicadoLeve && <p className="text-xs text-destructive font-medium">Esta falta leve ya fue registrada el {fecha === todayISO() ? "día de hoy" : formatDate(fecha)} para este estudiante.</p>}
                        </div>

                        {/* Descripción */}
                        <div className="space-y-1.5">
                            <Label>Descripción <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
                            <Textarea placeholder="Observaciones adicionales..." value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} />
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" onClick={cerrar} className="flex-1 cursor-pointer">Cancelar</Button>
                            <Button onClick={handleSubmit} disabled={!canSubmit} className="cursor-pointer flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
                                {saving ? "Guardando..." : "Registrar"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ── Página principal del profesor ──────────────────────────
export default function ProfesorDashboard() {
    const { user } = useAuth()
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
    const [tiposFalta, setTiposFalta] = useState<TipoFalta[]>([])
    const [todasInfracciones, setTodasInfracciones] = useState<Infraccion[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [filterCurso, setFilterCurso] = useState("all")
    const [filterSeccion, setFilterSeccion] = useState("all")

    const cargarDatos = async () => {
        if (!user?.id) return
        const [ests, tipos, infs] = await Promise.all([
            fetchEstudiantesProfesor(user.id),
            fetchTiposFalta(),
            fetchInfracciones(),
        ])
        setEstudiantes(ests); setTiposFalta(tipos); setTodasInfracciones(infs)
        setLoading(false)
    }

    useEffect(() => { cargarDatos() }, [user?.id])

    const cursosUnicos = useMemo(() => {
        const set = new Set(estudiantes.map(e => e.curso))
        return CURSOS.filter(c => set.has(c))
    }, [estudiantes])

    const seccionesUnicas = useMemo(() => {
        const set = new Set(estudiantes.filter(e => filterCurso === "all" || e.curso === filterCurso).map(e => e.seccion))
        return SECCIONES.filter(s => set.has(s))
    }, [estudiantes, filterCurso])

    const estudiantesFiltrados = useMemo(() =>
        estudiantes.filter(e => {
            if (filterCurso !== "all" && e.curso !== filterCurso) return false
            if (filterSeccion !== "all" && e.seccion !== filterSeccion) return false
            return matchesSearch(e.nombre_completo, search)
        }), [estudiantes, filterCurso, filterSeccion, search])

    // Infracciones que registró este profesor
    const misInfracciones = useMemo(() =>
        todasInfracciones.filter(i => i.regente_id === user?.id),
        [todasInfracciones, user?.id])

    if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="font-serif text-2xl font-bold text-foreground">Panel del Profesor</h1>
                    <p className="text-sm text-muted-foreground">Bienvenido, {user?.nombre_completo}</p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="gap-2 bg-[#0f1f3d] hover:bg-[#1a3461] text-white shrink-0 cursor-pointer">
                    <AlertTriangle className="size-4" />
                    <span className="hidden sm:inline">Nueva infracción</span>
                    <span className="sm:hidden">Nueva</span>
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
                        <div><p className="text-2xl font-bold">{estudiantes.length}</p><p className="text-xs text-muted-foreground">Mis estudiantes</p></div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-amber-600" /></div>
                        <div><p className="text-2xl font-bold">{misInfracciones.length}</p><p className="text-xs text-muted-foreground">Registradas por mí</p></div>
                    </CardContent>
                </Card>
                <Card className="col-span-2 md:col-span-1">
                    <CardContent className="flex items-center gap-3 p-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
                        <div><p className="text-2xl font-bold">{cursosUnicos.length}</p><p className="text-xs text-muted-foreground">Cursos disponibles</p></div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input placeholder="Buscar estudiante..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterCurso} onValueChange={v => { setFilterCurso(v); setFilterSeccion("all") }}>
                    <SelectTrigger className="w-full sm:w-40 cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos los cursos</SelectItem>
                        {cursosUnicos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filterSeccion} onValueChange={setFilterSeccion}>
                    <SelectTrigger className="w-full sm:w-36 cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas las secciones</SelectItem>
                        {seccionesUnicas.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Tabla de estudiantes */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">{estudiantesFiltrados.length} estudiante{estudiantesFiltrados.length !== 1 ? "s" : ""}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Curso</TableHead>
                                    <TableHead className="hidden sm:table-cell">Sección</TableHead>
                                    <TableHead className="text-center">Infracciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {estudiantesFiltrados.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="py-12 text-center text-muted-foreground text-sm">No se encontraron estudiantes</TableCell></TableRow>
                                ) : estudiantesFiltrados.map(est => {
                                    const infs = todasInfracciones.filter(i => i.estudiante_id === est.id)
                                    const graves = infs.filter(i => i.tipo_falta?.gravedad === "grave" || i.tipo_falta?.gravedad === "muy_grave").length
                                    return (
                                        <TableRow key={est.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2.5">
                                                    <Avatar className="size-8 shrink-0"><AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(est.nombre_completo)}</AvatarFallback></Avatar>
                                                    <span className="text-sm font-medium">{est.nombre_completo}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{est.curso}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-sm">{est.seccion}</TableCell>
                                            <TableCell className="text-center">
                                                {infs.length > 0
                                                    ? <div className="flex items-center justify-center gap-1.5">
                                                        <Badge variant="outline" className={graves > 0 ? "bg-destructive/10 text-destructive border-destructive/20 text-xs" : "bg-warning/10 text-warning border-warning/20 text-xs"}>{infs.length}</Badge>
                                                        {graves > 0 && <AlertTriangle className="size-3.5 text-destructive" />}
                                                    </div>
                                                    : <span className="text-xs text-muted-foreground">0</span>}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <RegistrarInfraccionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onCreated={cargarDatos}
                profesorId={user?.id ?? ""}
                estudiantes={estudiantes}
                tiposFalta={tiposFalta}
                todasInfracciones={todasInfracciones}
            />
        </div>
    )
}