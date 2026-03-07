"use client"

import { useState, useMemo } from "react"
import { getInfraccionesConDatos, mockTiposFalta } from "@/lib/mock-data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, BookOpen, CalendarDays, FileText } from "lucide-react"
import type { Infraccion } from "@/lib/types"

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

type InfRow = Infraccion

export default function AdminInfraccionesPage() {
  const [search, setSearch] = useState("")
  const [filterGravedad, setFilterGravedad] = useState("all")
  const [filterTipo, setFilterTipo] = useState("all")
  const [selected, setSelected] = useState<InfRow | null>(null)

  const infracciones = useMemo(() => getInfraccionesConDatos(), [])

  const filtered = useMemo(() => {
    return infracciones.filter(inf => {
      const matchSearch =
        !search ||
        inf.estudiante?.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
        inf.tipo_falta?.nombre.toLowerCase().includes(search.toLowerCase()) ||
        inf.descripcion.toLowerCase().includes(search.toLowerCase())
      const matchGravedad = filterGravedad === "all" || inf.tipo_falta?.gravedad === filterGravedad
      const matchTipo = filterTipo === "all" || inf.tipo_falta_id === filterTipo
      return matchSearch && matchGravedad && matchTipo
    })
  }, [infracciones, search, filterGravedad, filterTipo])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Infracciones</h1>
        <p className="text-muted-foreground text-sm mt-1">{infracciones.length} infracciones registradas en total</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por estudiante, tipo o descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
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
            {mockTiposFalta.map(tf => (
              <SelectItem key={tf.id} value={tf.id}>{tf.nombre}</SelectItem>
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
              <TableHead className="font-semibold text-gray-700">Fecha</TableHead>
              <TableHead className="font-semibold text-gray-700">Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                  No se encontraron infracciones con los filtros seleccionados
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(inf => {
                const gravedadCfg = getGravedadConfig(inf.tipo_falta!.gravedad)
                return (
                  <TableRow
                    key={inf.id}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setSelected(inf)}
                  >
                    <TableCell className="font-medium text-gray-900">{inf.estudiante?.nombre_completo}</TableCell>
                    <TableCell className="text-gray-600 text-sm">{inf.estudiante?.curso} {inf.estudiante?.seccion}</TableCell>
                    <TableCell className="text-gray-700">{inf.tipo_falta?.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${gravedadCfg.className}`}>{gravedadCfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm whitespace-nowrap">{formatDate(inf.fecha)}</TableCell>
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

      {/* Dialog detalle */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Detalle de infracción</DialogTitle>
          </DialogHeader>
          {selected && (() => {
            const gravedad = selected.tipo_falta ? getGravedadConfig(selected.tipo_falta.gravedad) : null
            return (
              <div className="space-y-4 pt-1">
                {/* Estudiante */}
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
                    <Badge variant="outline" className={gravedad.className}>{gravedad.label}</Badge>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Descripción</p>
                    <p className="text-sm leading-relaxed">{selected.descripcion || "Sin descripción."}</p>
                  </div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}