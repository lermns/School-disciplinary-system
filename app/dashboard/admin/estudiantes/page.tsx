"use client"

import { useState, useMemo, useCallback } from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchEstudiantesPaginados, fetchInfracciones } from "@/lib/data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search, Clock, FileText, AlertTriangle, UserCircle,
  BookOpen, CalendarDays, UserPlus, Trash2, Upload, KeyRound, Printer, Loader2,
} from "lucide-react"
import { CrearEstudianteModal } from "@/components/admin/crear-estudiante-modal"
import { ImportarEstudiantesModal } from "@/components/admin/importar-estudiantes-modal"
import { ImprimirCredencialesDialog } from "@/components/admin/imprimir-credenciales-dialog"
import { toast } from "sonner"
import type { Estudiante, Infraccion } from "@/lib/types"

const CURSOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const SECCIONES = ["A", "B", "C"]

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

interface Credencial {
  nombre_completo: string
  curso: string
  seccion: string
  codigo: string
  password: string
}

// ── Dialog detalle del estudiante ─────────────────────────
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
  estudiante, todasInfracciones, onClose, onDeleted, onPrintCredencial,
}: {
  estudiante: Estudiante | null
  todasInfracciones: Infraccion[]
  onClose: () => void
  onDeleted: () => void
  onPrintCredencial: (cred: Credencial) => void
}) {
  const [selectedInf, setSelectedInf] = useState<Infraccion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const infracciones = useMemo(() => {
    if (!estudiante) return []
    return todasInfracciones.filter(i => i.estudiante_id === estudiante.id)
  }, [estudiante, todasInfracciones])

  const retrasos = infracciones.filter(i => i.tipo_falta?.nombre === "Retraso").length
  const graves = infracciones.filter(i => i.tipo_falta?.gravedad === "grave" || i.tipo_falta?.gravedad === "muy_grave").length

  const handleDelete = async () => {
    if (!estudiante) return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/eliminar-estudiante", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estudianteId: estudiante.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) { toast.error(json.error ?? "Error al eliminar"); setDeleting(false); return }
      toast.success(`${estudiante.nombre_completo} eliminado correctamente`)
      setConfirmDelete(false)
      onClose()
      onDeleted()
    } catch { toast.error("Error de conexión"); setDeleting(false) }
  }

  const handleRegenerarCredenciales = async () => {
    if (!estudiante) return
    setRegenerating(true)
    try {
      const res = await fetch("/api/admin/regenerar-credenciales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estudianteId: estudiante.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) { toast.error(json.error ?? "Error"); setRegenerating(false); return }
      onClose()
      onPrintCredencial({ ...estudiante, ...json.credenciales })
    } catch { toast.error("Error de conexión") }
    setRegenerating(false)
  }

  return (
    <>
      <Dialog open={!!estudiante} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base">Perfil del Estudiante</DialogTitle>
              <Button
                variant="ghost" size="icon"
                className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                onClick={() => setConfirmDelete(true)}
                title="Eliminar estudiante"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </DialogHeader>

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

              <Button
                variant="outline"
                className="w-full gap-2 text-sm cursor-pointer"
                onClick={handleRegenerarCredenciales}
                disabled={regenerating}
              >
                {regenerating
                  ? <><span className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />Generando...</>
                  : <><KeyRound className="size-4" />Imprimir credenciales</>}
              </Button>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-2.5 text-center">
                  <p className="text-xl font-bold">{infracciones.length}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                  <p className="text-xl font-bold text-amber-600">{retrasos}</p>
                  <p className="text-[10px] text-muted-foreground">Retrasos</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                  <p className="text-xl font-bold text-destructive">{graves}</p>
                  <p className="text-[10px] text-muted-foreground">Graves</p>
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
                          className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
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

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />Eliminar estudiante
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                ¿Estás seguro de que deseas eliminar a <strong>{estudiante?.nombre_completo}</strong>?
                <br /><br />
                Esta acción eliminará permanentemente su perfil, cuenta de acceso e historial de infracciones.
                <br /><span className="font-semibold text-destructive">Esta acción no se puede deshacer.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90 text-white">
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
import { useDebounce } from "@/lib/use-debounce" // ← AGREGAR

// ── Página principal con INFINITE SCROLL ──────────────────
export default function AdminEstudiantesPage() {
  const [search, setSearch] = useState("")
  const [filterCurso, setFilterCurso] = useState("all")
  const [filterSeccion, setFilterSeccion] = useState("all")
  const debouncedSearch = useDebounce(search, 400) // 400ms de espera
  const [estudianteDetalle, setEstudianteDetalle] = useState<Estudiante | null>(null)
  const [crearOpen, setCrearOpen] = useState(false)
  const [importarOpen, setImportarOpen] = useState(false)
  const [credencialesImprimir, setCredencialesImprimir] = useState<Credencial[]>([])
  const [printOpen, setPrintOpen] = useState(false)
  const [todasInfracciones, setTodasInfracciones] = useState<Infraccion[]>([])

  // ✨ React Query con Infinite Scroll
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['estudiantes', filterCurso, filterSeccion, debouncedSearch],
    queryFn: ({ pageParam = 1 }) =>
      fetchEstudiantesPaginados(pageParam, 50, {
        curso: filterCurso !== 'all' ? filterCurso : undefined,
        seccion: filterSeccion !== 'all' ? filterSeccion : undefined,
        search: debouncedSearch || undefined,
      }),
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length + 1 : undefined
    },
    initialPageParam: 1,
  })

  // Cargar infracciones solo una vez (limitadas a las últimas 500)
  const cargarInfracciones = useCallback(async () => {
    const infs = await fetchInfracciones(500)
    setTodasInfracciones(infs)
  }, [])

  useMemo(() => {
    cargarInfracciones()
  }, [cargarInfracciones])

  // Aplanar todas las páginas de estudiantes
  const estudiantes = useMemo(() => {
    return data?.pages.flatMap(page => page.data) ?? []
  }, [data])

  const totalCount = data?.pages[0]?.total ?? 0

  const handlePrintCredencial = (cred: Credencial) => {
    setCredencialesImprimir([cred])
    setPrintOpen(true)
  }

  const handlePrintBatch = (resultados: Array<{ nombre_completo: string; curso: string; seccion: string; codigo: string; password: string }>) => {
    setCredencialesImprimir(resultados)
    setPrintOpen(true)
  }

  const handleCreatedOrImported = () => {
    refetch()
    cargarInfracciones()
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
      <Loader2 className="size-5 animate-spin mr-2" />
      Cargando estudiantes...
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Estudiantes</h1>
          <p className="text-sm text-muted-foreground">{totalCount} estudiantes activos</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setImportarOpen(true)}
            className="gap-2 cursor-pointer"
          >
            <Upload className="size-4" />
            <span className="hidden sm:inline">Importar Excel</span>
            <span className="sm:hidden">Importar</span>
          </Button>
          <Button
            onClick={() => setCrearOpen(true)}
            className="gap-2 bg-[#0f1f3d] hover:bg-[#1a3461] text-white cursor-pointer"
          >
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">Nuevo estudiante</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
          {/* Indicador de búsqueda activa */}
          {search !== debouncedSearch && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
            </div>
          )}
        </div>
        <Select value={filterCurso} onValueChange={setFilterCurso}>
          <SelectTrigger className="w-full sm:w-40 cursor-pointer"><SelectValue placeholder="Cursos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {CURSOS.map(c => <SelectItem key={c} value={c} className="cursor-pointer">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSeccion} onValueChange={setFilterSeccion}>
          <SelectTrigger className="w-full sm:w-36 cursor-pointer"><SelectValue placeholder="Sección" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las secciones</SelectItem>
            {SECCIONES.map(s => <SelectItem key={s} value={s} className="cursor-pointer">Sección {s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""} cargados
          </CardTitle>
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
                {estudiantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                      No se encontraron estudiantes
                    </TableCell>
                  </TableRow>
                ) : estudiantes.map(est => {
                  const infs = todasInfracciones.filter(i => i.estudiante_id === est.id)
                  const retrasos = infs.filter(i => i.tipo_falta?.nombre === "Retraso").length
                  const graves = infs.filter(i => i.tipo_falta?.gravedad === "grave" || i.tipo_falta?.gravedad === "muy_grave").length
                  return (
                    <TableRow
                      key={est.id}
                      className="cursor-pointer hover:bg-gray-300/50 transition-colors"
                      onClick={() => setEstudianteDetalle(est)}
                    >
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
                })}
              </TableBody>
            </Table>
          </div>

          {/* ✨ Botón cargar más */}
          {hasNextPage && (
            <div className="p-4 border-t flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="cursor-pointer"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Cargando...
                  </>
                ) : (
                  `Cargar más (${estudiantes.length} de ${totalCount})`
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <EstudianteDetalleDialog
        estudiante={estudianteDetalle}
        todasInfracciones={todasInfracciones}
        onClose={() => setEstudianteDetalle(null)}
        onDeleted={handleCreatedOrImported}
        onPrintCredencial={handlePrintCredencial}
      />

      <CrearEstudianteModal
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreated={handleCreatedOrImported}
      />

      <ImportarEstudiantesModal
        open={importarOpen}
        onClose={() => setImportarOpen(false)}
        onImported={handleCreatedOrImported}
        onPrintCredenciales={handlePrintBatch}
      />

      <ImprimirCredencialesDialog
        credenciales={credencialesImprimir}
        open={printOpen}
        onClose={() => { setPrintOpen(false); setCredencialesImprimir([]) }}
      />
    </div>
  )
}