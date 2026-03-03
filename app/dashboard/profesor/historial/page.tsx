"use client"

import { useState } from "react"
import { Search } from "lucide-react"
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
  mockInfracciones,
  mockEstudiantes,
  mockTiposFalta,
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

export default function ProfesorHistorialPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterEstado, setFilterEstado] = useState("todos")

  const myInfracciones = mockInfracciones
    .filter((i) => i.profesor_id === user?.id)
    .map((inf) => ({
      ...inf,
      estudiante: mockEstudiantes.find((e) => e.id === inf.estudiante_id),
      tipo_falta: mockTiposFalta.find((tf) => tf.id === inf.tipo_falta_id),
    }))

  const filtered = myInfracciones.filter((inf) => {
    const matchSearch =
      search === "" ||
      inf.estudiante?.nombre_completo
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      inf.tipo_falta?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      inf.descripcion.toLowerCase().includes(search.toLowerCase())

    const matchEstado =
      filterEstado === "todos" || inf.estado === filterEstado

    return matchSearch && matchEstado
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Mi Historial
        </h1>
        <p className="text-sm text-muted-foreground">
          Infracciones que usted ha registrado como profesor.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por estudiante, tipo de falta..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
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
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
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
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Descripcion
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No se encontraron registros.
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
                            <span className="text-sm font-medium">
                              {inf.estudiante?.nombre_completo}
                            </span>
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
                        <TableCell className="hidden max-w-[250px] truncate text-sm text-muted-foreground xl:table-cell">
                          {inf.descripcion}
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
    </div>
  )
}
