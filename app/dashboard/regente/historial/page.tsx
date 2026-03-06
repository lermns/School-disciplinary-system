"use client"

import { useState } from "react"
import { Search, CalendarDays, User, BookOpen, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import {
  mockInfracciones,
  mockEstudiantes,
  mockTiposFalta,
} from "@/lib/mock-data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

export default function RegenteHistorialPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")

  const myInfracciones = mockInfracciones
    .filter((i) => i.regente_id === user?.id)
    .map((inf) => ({
      ...inf,
      estudiante: mockEstudiantes.find((e) => e.id === inf.estudiante_id),
      tipo_falta: mockTiposFalta.find((tf) => tf.id === inf.tipo_falta_id),
    }))

  type InfRow = (typeof myInfracciones)[0]
  const [selected, setSelected] = useState<InfRow | null>(null)

  const filtered = myInfracciones.filter((inf) => {
    return (
      search === "" ||
      inf.estudiante?.nombre_completo
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      inf.tipo_falta?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      inf.descripcion.toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Mi Historial
        </h1>
        <p className="text-sm text-muted-foreground">
          Infracciones que usted ha registrado como regente.
        </p>
      </div>

      {/* Filtro */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por estudiante o tipo de falta..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
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
                  <TableHead className="hidden md:table-cell">Gravedad</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="hidden xl:table-cell">Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
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

                    return (
                      <TableRow
                        key={inf.id}
                        className="cursor-pointer hover:bg-muted/60"
                        onClick={() => setSelected(inf)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                {inf.estudiante
                                  ? getInitials(inf.estudiante.nombre_completo)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="text-sm font-medium">
                                {inf.estudiante?.nombre_completo}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {inf.estudiante?.curso} {inf.estudiante?.seccion}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {inf.tipo_falta?.nombre}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {gravedad && (
                            <Badge variant="outline" className={gravedad.className}>
                              {gravedad.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          {formatDate(inf.fecha)}
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
      {/* Dialog de detalle */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Detalle de infracción</DialogTitle>
          </DialogHeader>

          {selected && (() => {
            const gravedad = selected.tipo_falta
              ? getGravedadConfig(selected.tipo_falta.gravedad)
              : null
            return (
              <div className="space-y-4 pt-1">
                {/* Estudiante */}
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

                {/* Info */}
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

                {/* Gravedad */}
                {gravedad && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Gravedad:</span>
                    <Badge variant="outline" className={gravedad.className}>
                      {gravedad.label}
                    </Badge>
                  </div>
                )}

                {/* Descripción completa */}
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
    </div>
  )
}