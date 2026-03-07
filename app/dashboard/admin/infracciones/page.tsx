"use client"

import { useState, useMemo } from "react"
import {
  getInfraccionesConDatos,
  mockEstudiantes,
  mockTiposFalta,
  mockInfracciones,
  mockUsuarios,
} from "@/lib/mock-data"
import { getGravedadConfig, formatDate, todayISO } from "@/lib/helpers"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  Plus,
  BookOpen,
  CalendarDays,
  FileText,
  CheckCircle2,
} from "lucide-react"
import type { Infraccion } from "@/lib/types"

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
}

// ── Modal nueva infracción ──────────────────────────────────
function NuevaInfraccionModal({
  open,
  onClose,
  onCreated,
  adminId,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  adminId: string
}) {
  const [estudianteId, setEstudianteId] = useState("")
  const [tipoFaltaId, setTipoFaltaId] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [fecha, setFecha] = useState(todayISO())
  const [success, setSuccess] = useState(false)
  const [search, setSearch] = useState("")

  const estudiantesActivos = mockEstudiantes.filter((e) => e.activo)
  const filteredEstudiantes = estudiantesActivos.filter((e) =>
    !search || e.nombre_completo.toLowerCase().includes(search.toLowerCase())
  )

  const estudianteSeleccionado = mockEstudiantes.find((e) => e.id === estudianteId)
  const tipoSeleccionado = mockTiposFalta.find((tf) => tf.id === tipoFaltaId)

  const canSubmit = estudianteId && tipoFaltaId && fecha

  const handleSubmit = () => {
    if (!canSubmit) return
    const nueva = {
      id: `i${Date.now()}`,
      estudiante_id: estudianteId,
      regente_id: adminId,
      tipo_falta_id: tipoFaltaId,
      fecha,
      descripcion,
      created_at: new Date().toISOString(),
    }
    mockInfracciones.push(nueva)
    setSuccess(true)
  }

  const cerrar = () => {
    setEstudianteId("")
    setTipoFaltaId("")
    setDescripcion("")
    setFecha(todayISO())
    setSearch("")
    setSuccess(false)
    onClose()
    if (success) onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar nueva infracción</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <p className="font-semibold text-foreground">¡Infracción registrada!</p>
            <p className="text-sm text-muted-foreground">
              La falta de{" "}
              <strong>{estudianteSeleccionado?.nombre_completo}</strong> ha sido
              guardada correctamente.
            </p>
            <Button onClick={cerrar} className="mt-2 w-full bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
              Cerrar
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Estudiante */}
            <div className="space-y-1.5">
              <Label>Estudiante <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar estudiante..."
                  value={estudianteSeleccionado ? estudianteSeleccionado.nombre_completo : search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setEstudianteId("")
                  }}
                  className="pl-9"
                />
              </div>
              {/* Dropdown estudiantes */}
              {!estudianteId && search && (
                <div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto shadow-sm">
                  {filteredEstudiantes.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-3">Sin resultados</p>
                  ) : (
                    filteredEstudiantes.map((e) => (
                      <button
                        key={e.id}
                        onClick={() => {
                          setEstudianteId(e.id)
                          setSearch("")
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                      >
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {getInitials(e.nombre_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{e.nombre_completo}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.curso} — Sección {e.seccion}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {estudianteSeleccionado && (
                <div className="flex items-center justify-between rounded-lg bg-muted/50 border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-6 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {getInitials(estudianteSeleccionado.nombre_completo)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{estudianteSeleccionado.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">
                        {estudianteSeleccionado.curso} — Sección {estudianteSeleccionado.seccion}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEstudianteId("")}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            {/* Tipo de falta */}
            <div className="space-y-1.5">
              <Label>Tipo de falta <span className="text-destructive">*</span></Label>
              <Select value={tipoFaltaId} onValueChange={setTipoFaltaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {mockTiposFalta.map((tf) => {
                    const g = getGravedadConfig(tf.gravedad)
                    return (
                      <SelectItem key={tf.id} value={tf.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: tf.color }}
                          />
                          <span>{tf.nombre}</span>
                          <span className={`ml-1 text-xs ${g.className} px-1.5 py-0.5 rounded border`}>
                            {g.label}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <Label>Fecha <span className="text-destructive">*</span></Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                max={todayISO()}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <Label>
                Descripción{" "}
                <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
              </Label>
              <Textarea
                placeholder="Observaciones adicionales..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={cerrar} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white"
              >
                Registrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Página principal ────────────────────────────────────────
export default function AdminInfraccionesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterGravedad, setFilterGravedad] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [selected, setSelected] = useState<Infraccion | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const infracciones = useMemo(() => getInfraccionesConDatos(), [refreshKey])

  const filtered = useMemo(() => {
    return infracciones.filter((inf) => {
      const matchSearch =
        !search ||
        inf.estudiante?.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
        inf.tipo_falta?.nombre.toLowerCase().includes(search.toLowerCase()) ||
        inf.descripcion.toLowerCase().includes(search.toLowerCase())
      const matchGravedad =
        filterGravedad === "all" || inf.tipo_falta?.gravedad === filterGravedad
      const matchTipo = filterTipo === "all" || inf.tipo_falta_id === filterTipo
      return matchSearch && matchGravedad && matchTipo
    })
  }, [infracciones, search, filterGravedad, filterTipo])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Infracciones</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {infracciones.length} infracciones registradas en total
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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por estudiante, tipo o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterGravedad} onValueChange={setFilterGravedad}>
          <SelectTrigger className="w-full sm:w-44">
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
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Tipo de falta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {mockTiposFalta.map((tf) => (
              <SelectItem key={tf.id} value={tf.id}>
                {tf.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
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
                  No se encontraron infracciones con los filtros seleccionados
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inf) => {
                const gravedadCfg = getGravedadConfig(inf.tipo_falta!.gravedad)
                const registradoPor = mockUsuarios.find((u) => u.id === inf.regente_id)
                return (
                  <TableRow
                    key={inf.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(inf)}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {inf.estudiante?.nombre_completo}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {inf.estudiante?.curso} {inf.estudiante?.seccion}
                    </TableCell>
                    <TableCell className="text-gray-700">{inf.tipo_falta?.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${gravedadCfg.className}`}>
                        {gravedadCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <span>{registradoPor?.nombre_completo ?? "—"}</span>
                        {registradoPor?.rol === "admin" && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 bg-blue-50 text-blue-600 border-blue-200">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                      {formatDate(inf.fecha)}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm max-w-xs hidden lg:table-cell">
                      <span className="line-clamp-2">{inf.descripcion}</span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog detalle */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Detalle de infracción</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const gravedad = selected.tipo_falta
              ? getGravedadConfig(selected.tipo_falta.gravedad)
              : null
            const registradoPor = mockUsuarios.find((u) => u.id === selected.regente_id)
            return (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {selected.estudiante
                        ? getInitials(selected.estudiante.nombre_completo)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">
                      {selected.estudiante?.nombre_completo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selected.estudiante?.curso} — Sección {selected.estudiante?.seccion}
                    </p>
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

                {gravedad && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Gravedad:</span>
                    <Badge variant="outline" className={gravedad.className}>
                      {gravedad.label}
                    </Badge>
                  </div>
                )}

                {registradoPor && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-xs text-muted-foreground">Registrado por:</span>
                    <span className="font-medium text-xs">{registradoPor.nombre_completo}</span>
                    {registradoPor.rol === "admin" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-600 border-blue-200">
                        Admin
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm leading-relaxed">
                      {selected.descripcion || "Sin descripción."}
                    </p>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal nueva infracción */}
      <NuevaInfraccionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
        adminId={user?.id ?? "u1"}
      />
    </div>
  )
}