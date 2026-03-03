"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Plus,
  Eye,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  mockEstudiantes,
  mockTiposFalta,
  getInfraccionesConDatos,
} from "@/lib/mock-data"
import { getGravedadConfig, getEstadoConfig, formatDate } from "@/lib/helpers"
import type { Infraccion } from "@/lib/types"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

export default function InfraccionesPage() {
  const [search, setSearch] = useState("")
  const [gravedadFilter, setGravedadFilter] = useState("all")
  const [estadoFilter, setEstadoFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailInfraccion, setDetailInfraccion] = useState<Infraccion | null>(
    null
  )
  const [detailOpen, setDetailOpen] = useState(false)

  const infracciones = getInfraccionesConDatos()

  const filtered = useMemo(() => {
    return infracciones.filter((inf) => {
      const matchesSearch = inf.estudiante?.nombre_completo
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesGravedad =
        gravedadFilter === "all"
          ? true
          : inf.tipo_falta?.gravedad === gravedadFilter
      const matchesEstado =
        estadoFilter === "all" ? true : inf.estado === estadoFilter
      return matchesSearch && matchesGravedad && matchesEstado
    })
  }, [search, gravedadFilter, estadoFilter, infracciones])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Gestión de Infracciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Registro y seguimiento de infracciones disciplinarias
          </p>
        </div>

        {/* Register Infraction Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="mr-2 size-4" />
              Registrar Infracción
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Infracción</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success("Infracción registrada exitosamente")
                setDialogOpen(false)
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Estudiante</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockEstudiantes
                      .filter((e) => e.activo)
                      .map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nombre_completo} - {e.curso} {e.seccion}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Falta</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTiposFalta.map((tf) => {
                      const config = getGravedadConfig(tf.gravedad)
                      return (
                        <SelectItem key={tf.id} value={tf.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block size-2 rounded-full ${config.dotColor}`}
                            />
                            {tf.nombre}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Descripción (mín. 20 caracteres)</Label>
                <Textarea
                  placeholder="Describe la infracción con detalle..."
                  minLength={20}
                  required
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Sanción</Label>
                <Textarea
                  placeholder="Sanción aplicada..."
                  rows={2}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                Registrar Infracción
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de estudiante..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={gravedadFilter} onValueChange={setGravedadFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Gravedad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="leve">Leve</SelectItem>
              <SelectItem value="grave">Grave</SelectItem>
              <SelectItem value="muy_grave">Muy Grave</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="resuelto">Resuelto</SelectItem>
              <SelectItem value="apelado">Apelado</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="hidden sm:table-cell">Curso</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Profesor
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Gravedad
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inf) => {
                  const gravedad = inf.tipo_falta
                    ? getGravedadConfig(inf.tipo_falta.gravedad)
                    : null
                  const estado = getEstadoConfig(inf.estado)

                  return (
                    <TableRow key={inf.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {inf.estudiante
                                ? getInitials(inf.estudiante.nombre_completo)
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {inf.estudiante?.nombre_completo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {inf.estudiante?.curso} {inf.estudiante?.seccion}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {inf.profesor?.nombre_completo}
                      </TableCell>
                      <TableCell className="text-sm">
                        {inf.tipo_falta?.nombre}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {gravedad && (
                          <Badge
                            variant="outline"
                            className={gravedad.className}
                          >
                            {gravedad.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(inf.fecha)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estado.className}>
                          {estado.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setDetailInfraccion(inf)
                            setDetailOpen(true)
                          }}
                          aria-label="Ver detalle"
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          {detailInfraccion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-warning" />
                  Detalle de Infracción
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {detailInfraccion.estudiante
                        ? getInitials(
                            detailInfraccion.estudiante.nombre_completo
                          )
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {detailInfraccion.estudiante?.nombre_completo}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {detailInfraccion.estudiante?.curso}{" "}
                      {detailInfraccion.estudiante?.seccion}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Tipo de Falta
                    </p>
                    <p className="font-medium">
                      {detailInfraccion.tipo_falta?.nombre}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gravedad</p>
                    {detailInfraccion.tipo_falta && (
                      <Badge
                        variant="outline"
                        className={
                          getGravedadConfig(
                            detailInfraccion.tipo_falta.gravedad
                          ).className
                        }
                      >
                        {
                          getGravedadConfig(
                            detailInfraccion.tipo_falta.gravedad
                          ).label
                        }
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha</p>
                    <p className="font-medium">
                      {formatDate(detailInfraccion.fecha)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <Badge
                      variant="outline"
                      className={
                        getEstadoConfig(detailInfraccion.estado).className
                      }
                    >
                      {getEstadoConfig(detailInfraccion.estado).label}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-xs text-muted-foreground mb-1">
                    Descripción
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {detailInfraccion.descripcion}
                  </p>
                </div>

                <div className="text-sm">
                  <p className="text-xs text-muted-foreground mb-1">
                    Sanción Aplicada
                  </p>
                  <p className="text-foreground">
                    {detailInfraccion.sancion}
                  </p>
                </div>

                <Separator />

                <p className="text-xs text-muted-foreground">
                  Registrado por:{" "}
                  <span className="font-medium text-foreground">
                    {detailInfraccion.profesor?.nombre_completo}
                  </span>
                </p>

                {/* Admin Status Change */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-success/30 text-success hover:bg-success/10"
                    onClick={() => {
                      toast.success("Estado actualizado a Resuelto")
                      setDetailOpen(false)
                    }}
                  >
                    Marcar Resuelto
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-warning/30 text-warning hover:bg-warning/10"
                    onClick={() => {
                      toast.success("Estado actualizado a Apelado")
                      setDetailOpen(false)
                    }}
                  >
                    Marcar Apelado
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
