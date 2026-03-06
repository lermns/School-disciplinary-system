"use client"

import { useState } from "react"
import { Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { useAuth } from "@/lib/auth-context"
import {
  getHijosDelPadre,
  getEstudianteInfracciones,
  mockTiposFalta,
  mockUsuarios,
} from "@/lib/mock-data"
import { getGravedadConfig, getEstadoConfig, formatDate } from "@/lib/helpers"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

export default function PadreMisHijosPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterEstudiante, setFilterEstudiante] = useState("todos")
  const [filterEstado, setFilterEstado] = useState("todos")

  if (!user) return null

  const hijos = getHijosDelPadre(user.id)

  const allInfracciones = hijos.flatMap((hijo) =>
    getEstudianteInfracciones(hijo.id).map((inf) => ({
      ...inf,
      estudiante: hijo,
      tipo_falta: mockTiposFalta.find((tf) => tf.id === inf.tipo_falta_id),
      profesor: mockUsuarios.find((u) => u.id === inf.profesor_id),
    }))
  )

  const filtered = allInfracciones.filter((inf) => {
    const matchSearch =
      search === "" ||
      inf.estudiante?.nombre_completo
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      inf.tipo_falta?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      inf.descripcion.toLowerCase().includes(search.toLowerCase())

    const matchEstudiante =
      filterEstudiante === "todos" ||
      inf.estudiante_id === filterEstudiante

    const matchEstado =
      filterEstado === "todos" || inf.estado === filterEstado

    return matchSearch && matchEstudiante && matchEstado
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Historial de Faltas
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulte el historial completo de infracciones de sus hijos.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, tipo de falta..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filterEstudiante}
              onValueChange={setFilterEstudiante}
            >
              <SelectTrigger className="w-40">
                <Filter className="mr-2 size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Hijo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los hijos</SelectItem>
                {hijos.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="resuelto">Resuelto</SelectItem>
                <SelectItem value="apelado">Apelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Infractions Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {filtered.length} infraccion{filtered.length !== 1 ? "es" : ""}{" "}
            encontrada{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Tipo de Falta</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Gravedad
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Profesor
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Sancion
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No se encontraron infracciones con los filtros
                      seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inf) => {
                    const gravedad = inf.tipo_falta
                      ? getGravedadConfig(inf.tipo_falta.gravedad)
                      : null
                    const estado = getEstadoConfig(inf.estado)

                    return (
                      <TableRow key={inf.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                {inf.estudiante
                                  ? getInitials(
                                      inf.estudiante.nombre_completo
                                    )
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm font-medium">
                                {inf.estudiante?.nombre_completo}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {inf.estudiante?.curso} &quot;
                                {inf.estudiante?.seccion}&quot;
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {inf.tipo_falta?.nombre}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {gravedad && (
                            <Badge
                              variant="outline"
                              className={gravedad.className}
                            >
                              {gravedad.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {inf.profesor?.nombre_completo}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {formatDate(inf.fecha)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={estado.className}
                          >
                            {estado.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] truncate text-sm text-muted-foreground xl:table-cell">
                          {inf.sancion}
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

      {/* Detail cards per child */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {hijos.map((hijo) => {
          const infracciones = getEstudianteInfracciones(hijo.id)
          const leves = infracciones.filter((i) => {
            const tf = mockTiposFalta.find((t) => t.id === i.tipo_falta_id)
            return tf?.gravedad === "leve"
          }).length
          const graves = infracciones.filter((i) => {
            const tf = mockTiposFalta.find((t) => t.id === i.tipo_falta_id)
            return tf?.gravedad === "grave"
          }).length
          const muyGraves = infracciones.filter((i) => {
            const tf = mockTiposFalta.find((t) => t.id === i.tipo_falta_id)
            return tf?.gravedad === "muy_grave"
          }).length

          return (
            <Card key={hijo.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {getInitials(hijo.nombre_completo)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm">
                      {hijo.nombre_completo}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {hijo.curso} &quot;{hijo.seccion}&quot;
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-success" />
                    <span className="text-xs text-muted-foreground">
                      Leves: {leves}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-warning" />
                    <span className="text-xs text-muted-foreground">
                      Graves: {graves}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full bg-destructive" />
                    <span className="text-xs text-muted-foreground">
                      Muy Graves: {muyGraves}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
