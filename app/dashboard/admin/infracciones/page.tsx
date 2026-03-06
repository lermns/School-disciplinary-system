"use client"

import { useState, useMemo } from "react"
import { getInfraccionesConDatos, mockEstudiantes, mockTiposFalta } from "@/lib/mock-data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter } from "lucide-react"

export default function AdminInfraccionesPage() {
  const [search, setSearch] = useState("")
  const [filterGravedad, setFilterGravedad] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")

  const infracciones = useMemo(() => getInfraccionesConDatos(), [])

  const filtered = useMemo(() => {
    return infracciones.filter((inf) => {
      const matchSearch =
        !search ||
        inf.estudiante?.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
        inf.tipo_falta?.nombre.toLowerCase().includes(search.toLowerCase()) ||
        inf.descripcion.toLowerCase().includes(search.toLowerCase())

      const matchGravedad =
        filterGravedad === "all" || inf.tipo_falta?.gravedad === filterGravedad

      const matchTipo =
        filterTipo === "all" || inf.tipo_falta_id === filterTipo

      return matchSearch && matchGravedad && matchTipo
    })
  }, [infracciones, search, filterGravedad, filterTipo])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Infracciones</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {infracciones.length} infracciones registradas en total
        </p>
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
              <TableHead className="font-semibold text-gray-700">Regente</TableHead>
              <TableHead className="font-semibold text-gray-700">Fecha</TableHead>
              <TableHead className="font-semibold text-gray-700">Descripción</TableHead>
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
                return (
                  <TableRow key={inf.id} className="hover:bg-gray-50/50 transition-colors">
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
                    <TableCell className="text-gray-600 text-sm">
                      {inf.regente?.nombre_completo}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm whitespace-nowrap">
                      {formatDate(inf.fecha)}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm max-w-xs">
                      <span className="line-clamp-2">{inf.descripcion}</span>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}