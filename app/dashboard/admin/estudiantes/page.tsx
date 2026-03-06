"use client"

import { useMemo, useState } from "react"
import { mockEstudiantes } from "@/lib/mock-data"
import type { Estudiante } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, UserCircle, AlertTriangle } from "lucide-react"

const CURSOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const SECCIONES = ["A", "B", "C"]

const emptyForm = {
  nombre_completo: "",
  curso: "1ro",
  seccion: "A",
  direccion: "",
}

export default function AdminEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>(mockEstudiantes)
  const [search, setSearch] = useState("")
  const [filterCurso, setFilterCurso] = useState("all")
  const [filterSeccion, setFilterSeccion] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Estudiante | null>(null)
  const [eliminando, setEliminando] = useState<Estudiante | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activos = useMemo(
    () => mockEstudiantes.filter((e) => e.activo),
    []
  )

  const filtered = useMemo(() => {
    return activos.filter((e) => {
      const matchSearch =
        !search ||
        e.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
        e.curso.toLowerCase().includes(search.toLowerCase())
      const matchCurso = filterCurso === "all" || e.curso === filterCurso
      const matchSeccion = filterSeccion === "all" || e.seccion === filterSeccion
      return matchSearch && matchCurso && matchSeccion
    })
  }, [activos, search, filterCurso, filterSeccion])


  const abrirNuevo = () => {
    setEditando(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  const abrirEditar = (e: Estudiante) => {
    setEditando(e)
    setForm({ nombre_completo: e.nombre_completo, curso: e.curso, seccion: e.seccion, direccion: e.direccion })
    setErrors({})
    setDialogOpen(true)
  }

  const confirmarEliminar = (e: Estudiante) => {
    setEliminando(e)
    setDeleteDialogOpen(true)
  }

  const validar = () => {
    const errs: Record<string, string> = {}
    if (!form.nombre_completo.trim()) errs.nombre_completo = "El nombre es requerido"
    if (!form.direccion.trim()) errs.direccion = "La dirección es requerida"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const guardar = () => {
    if (!validar()) return
    if (editando) {
      setEstudiantes((prev) =>
        prev.map((e) =>
          e.id === editando.id
            ? { ...e, nombre_completo: form.nombre_completo, curso: form.curso, seccion: form.seccion, direccion: form.direccion }
            : e
        )
      )
    } else {
      const nuevo: Estudiante = {
        id: `e${Date.now()}`,
        nombre_completo: form.nombre_completo,
        curso: form.curso,
        seccion: form.seccion,
        direccion: form.direccion,
        foto_url: null,
        activo: true,
        created_at: new Date().toISOString(),
      }
      setEstudiantes((prev) => [...prev, nuevo])
    }
    setDialogOpen(false)
  }

  const eliminar = () => {
    if (eliminando) {
      setEstudiantes((prev) => prev.filter((e) => e.id !== eliminando.id))
    }
    setDeleteDialogOpen(false)
    setEliminando(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Estudiantes</h1>
          <p className="text-muted-foreground text-sm mt-1">{estudiantes.filter(e => e.activo).length} activos de {estudiantes.length}</p>
        </div>
        <Button onClick={abrirNuevo} className="bg-[#0f1f3d] hover:bg-[#1a3461] text-white gap-2">
          <Plus className="w-4 h-4" />
          Nuevo estudiante
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por nombre o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCurso} onValueChange={setFilterCurso}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Todos los cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {CURSOS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSeccion} onValueChange={setFilterSeccion}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Sección" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Secciones</SelectItem>
            {SECCIONES.map((s) => (
              <SelectItem key={s} value={s}>Sección {s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="font-semibold text-gray-700">Estudiante</TableHead>
              <TableHead className="font-semibold text-gray-700">Curso</TableHead>
              <TableHead className="font-semibold text-gray-700">Dirección</TableHead>
              <TableHead className="font-semibold text-gray-700">Estado</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                  No se encontraron estudiantes
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((est) => (
                <TableRow key={est.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCircle className="w-8 h-8 text-gray-300 shrink-0" />
                      <span className="font-medium text-gray-900">{est.nombre_completo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-700">{est.curso} {est.seccion}</span>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm max-w-xs">
                    <span className="line-clamp-1">{est.direccion}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={est.activo
                        ? "bg-green-50 text-green-700 border-green-200 text-xs"
                        : "bg-gray-50 text-gray-500 border-gray-200 text-xs"
                      }
                    >
                      {est.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => abrirEditar(est)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0f1f3d] hover:bg-gray-100 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmarEliminar(est)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar estudiante" : "Nuevo estudiante"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ej: Juan García López"
                value={form.nombre_completo}
                onChange={(e) => setForm((f) => ({ ...f, nombre_completo: e.target.value }))}
              />
              {errors.nombre_completo && <p className="text-xs text-red-500">{errors.nombre_completo}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Curso <span className="text-red-500">*</span></Label>
                <Select value={form.curso} onValueChange={(v) => setForm((f) => ({ ...f, curso: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURSOS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Sección <span className="text-red-500">*</span></Label>
                <Select value={form.seccion} onValueChange={(v) => setForm((f) => ({ ...f, seccion: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECCIONES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Dirección <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ej: Calle 45 #12-34, Bogotá"
                value={form.direccion}
                onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              />
              {errors.direccion && <p className="text-xs text-red-500">{errors.direccion}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} className="bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
              {editando ? "Guardar cambios" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Eliminar estudiante
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar a <strong>{eliminando?.nombre_completo}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}