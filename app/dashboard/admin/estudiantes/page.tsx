"use client"

import { useState, useMemo, useEffect } from "react"
import { fetchEstudiantes, fetchInfracciones } from "@/lib/data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Clock, FileText, AlertTriangle, UserCircle, BookOpen, CalendarDays } from "lucide-react"
import type { Estudiante, Infraccion } from "@/lib/types"

const CURSOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const SECCIONES = ["A", "B", "C"]

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function InfraccionDialog({ selected, onClose }: { selected: Infraccion | null; onClose: () => void }) {
  const gravedad = selected?.tipo_falta ? getGravedadConfig(selected.tipo_falta.gravedad) : null
  return (
    <Dialog open={!!selected} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-base">Detalle de infracción</DialogTitle></DialogHeader>
        {selected && (
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
                <div><p className="text-xs text-muted-foreground">Tipo de falta</p><p className="font-medium">{selected.tipo_falta?.nombre ?? "—"}</p></div>
              </div>
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div><p className="text-xs text-muted-foreground">Fecha</p><p className="font-medium">{formatDate(selected.fecha)}</p></div>
              </div>
            </div>
            {gravedad && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Gravedad:</span>
                <Badge variant="outline" className={gravedad.className}>{gravedad.label}</Badge>
              </div>
            )}
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div><p className="text-xs text-muted-foreground mb-1">Descripción</p><p className="text-sm leading-relaxed">{selected.descripcion || "Sin descripción."}</p></div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function EstudianteDetalleDialog({
  estudiante, todasInfracciones, onClose,
}: { estudiante: Estudiante | null; todasInfracciones: Infraccion[]; onClose: () => void }) {
  const [selectedInf, setSelectedInf] = useState<Infraccion | null>(null)

  const infracciones = useMemo(() => {
    if (!estudiante) return []
    return todasInfracciones.filter(i => i.estudiante_id === estudiante.id)
  }, [estudiante, todasInfracciones])

  const retrasos = infracciones.filter(i => i.tipo_falta?.nombre === "Retraso").length
  const graves = infracciones.filter(i => i.tipo_falta?.gravedad === "grave" || i.tipo_falta?.gravedad === "muy_grave").length

  return (
    <>
      <Dialog open={!!estudiante} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-base">Perfil del Estudiante</DialogTitle></DialogHeader>
          {estudiante && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                  <UserCircle className="size-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{estudiante.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">{estudiante.curso} — Sección {estudiante.seccion}</p>
                  <p className="text-xs text-muted-foreground truncate">{estudiante.direccion}</p>
                </div>
                <Badge variant="outline" className={estudiante.activo ? "bg-green-50 text-green-700 border-green-200 text-xs" : "bg-gray-50 text-gray-500 border-gray-200 text-xs"}>
                  {estudiante.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-2.5 text-center">
                  <p className="text-xl font-bold text-foreground">{infracciones.length}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                  <p className="text-xl font-bold text-amber-600">{retrasos}</p>
                  <p className="text-[10px] text-muted-foreground">Retrasos</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                  <p className="text-xl font-bold text-destructive">{graves}</p>
                  <p className="text-[10px] text-muted-foreground">Muy Graves</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Historial de infracciones</p>
                {infracciones.length === 0 ? (
                  <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Sin infracciones registradas ✓</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {infracciones.map(inf => {
                      const g = inf.tipo_falta ? getGravedadConfig(inf.tipo_falta.gravedad) : null
                      return (
                        <button key={inf.id} onClick={() => setSelectedInf(inf)}
                          className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm">{inf.tipo_falta?.nombre ?? "—"}</p>
                            {g && <Badge variant="outline" className={`text-xs shrink-0 ${g.className}`}>{g.label}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(inf.fecha)}</p>
                          {inf.descripcion && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{inf.descripcion}</p>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <InfraccionDialog selected={selectedInf} onClose={() => setSelectedInf(null)} />
    </>
  )
}

export default function AdminEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [todasInfracciones, setTodasInfracciones] = useState<Infraccion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCurso, setFilterCurso] = useState("all")
  const [filterSeccion, setFilterSeccion] = useState("all")
  const [estudianteDetalle, setEstudianteDetalle] = useState<Estudiante | null>(null)

  useEffect(() => {
    Promise.all([fetchEstudiantes(), fetchInfracciones()]).then(([ests, infs]) => {
      setEstudiantes(ests)
      setTodasInfracciones(infs)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    return estudiantes.filter(e => {
      const matchSearch = !search || e.nombre_completo.toLowerCase().includes(search.toLowerCase()) || e.curso.toLowerCase().includes(search.toLowerCase())
      const matchCurso = filterCurso === "all" || e.curso === filterCurso
      const matchSeccion = filterSeccion === "all" || e.seccion === filterSeccion
      return matchSearch && matchCurso && matchSeccion && e.activo
    })
  }, [estudiantes, search, filterCurso, filterSeccion])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando estudiantes...</div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Estudiantes</h1>
        <p className="text-sm text-muted-foreground">{estudiantes.filter(e => e.activo).length} estudiantes activos en el sistema</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Buscar por nombre o curso..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCurso} onValueChange={setFilterCurso}>
          <SelectTrigger className="w-full sm:w-40 cursor-pointer"><SelectValue placeholder="Todos los cursos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cursos</SelectItem>
            {CURSOS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeccion} onValueChange={setFilterSeccion}>
          <SelectTrigger className="w-full sm:w-36 cursor-pointer"><SelectValue placeholder="Sección" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Secciones</SelectItem>
            {SECCIONES.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{filtered.length} estudiante{filtered.length !== 1 ? "s" : ""}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead className="hidden sm:table-cell">Sección</TableHead>
                  <TableHead className="hidden md:table-cell">Dirección</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Retrasos</TableHead>
                  <TableHead className="text-center">Infracciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                      {estudiantes.length === 0 ? "No hay estudiantes registrados aún" : "No se encontraron estudiantes"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(est => {
                    const infs = todasInfracciones.filter(i => i.estudiante_id === est.id)
                    const retrasos = infs.filter(i => i.tipo_falta?.nombre === "Retraso").length
                    const graves = infs.filter(i => i.tipo_falta?.gravedad === "grave" || i.tipo_falta?.gravedad === "muy_grave").length
                    return (
                      <TableRow key={est.id} className="cursor-pointer hover:bg-gray-300/50 transition-colors" onClick={() => setEstudianteDetalle(est)}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="size-8 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(est.nombre_completo)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{est.nombre_completo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{est.curso}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{est.seccion}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[180px] truncate">{est.direccion}</TableCell>
                        <TableCell className="hidden lg:table-cell text-center">
                          {retrasos > 0
                            ? <div className="flex items-center justify-center gap-1"><Clock className="size-3.5 text-amber-500" /><span className="text-sm font-medium text-amber-600">{retrasos}</span></div>
                            : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
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
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <EstudianteDetalleDialog estudiante={estudianteDetalle} todasInfracciones={todasInfracciones} onClose={() => setEstudianteDetalle(null)} />
    </div>
  )
}