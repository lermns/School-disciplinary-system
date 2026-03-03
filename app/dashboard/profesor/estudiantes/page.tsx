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
import { mockEstudiantes, getEstudianteInfracciones } from "@/lib/mock-data"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

export default function ProfesorEstudiantesPage() {
  const [search, setSearch] = useState("")
  const [filterCurso, setFilterCurso] = useState("todos")

  const cursos = [...new Set(mockEstudiantes.map((e) => e.curso))].sort()

  const filtered = mockEstudiantes.filter((e) => {
    const matchSearch =
      search === "" ||
      e.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
      e.curso.toLowerCase().includes(search.toLowerCase())

    const matchCurso = filterCurso === "todos" || e.curso === filterCurso

    return matchSearch && matchCurso && e.activo
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Estudiantes
        </h1>
        <p className="text-sm text-muted-foreground">
          Directorio de estudiantes activos del colegio.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar estudiante..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterCurso} onValueChange={setFilterCurso}>
            <SelectTrigger className="w-32">
              <Filter className="mr-2 size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {cursos.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {filtered.length} estudiante{filtered.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Seccion
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Direccion
                  </TableHead>
                  <TableHead className="text-right">Infracciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((est) => {
                  const infracciones = getEstudianteInfracciones(est.id)
                  return (
                    <TableRow key={est.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(est.nombre_completo)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">
                            {est.nombre_completo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{est.curso}</TableCell>
                      <TableCell className="hidden text-sm sm:table-cell">
                        {est.seccion}
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] truncate text-sm text-muted-foreground md:table-cell">
                        {est.direccion}
                      </TableCell>
                      <TableCell className="text-right">
                        {infracciones.length > 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-warning/10 text-warning border-warning/20"
                          >
                            {infracciones.length}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            0
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
