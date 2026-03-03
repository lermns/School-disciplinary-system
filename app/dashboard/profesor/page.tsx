"use client"

import {
  Users,
  AlertTriangle,
  CheckCircle,
  ClipboardList,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import {
  mockEstudiantes,
  mockInfracciones,
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

export default function ProfesorDashboard() {
  const { user } = useAuth()

  const myInfracciones = mockInfracciones
    .filter((i) => i.profesor_id === user?.id)
    .map((inf) => ({
      ...inf,
      estudiante: mockEstudiantes.find((e) => e.id === inf.estudiante_id),
      tipo_falta: mockTiposFalta.find((tf) => tf.id === inf.tipo_falta_id),
    }))

  const totalEstudiantes = mockEstudiantes.filter((e) => e.activo).length
  const misRegistros = myInfracciones.length
  const resueltos = myInfracciones.filter((i) => i.estado === "resuelto").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Dashboard del Profesor
        </h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido, {user?.nombre_completo}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-chart-2/10">
              <Users className="size-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {totalEstudiantes}
              </p>
              <p className="text-xs text-muted-foreground">
                Estudiantes Activos
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/10">
              <ClipboardList className="size-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {misRegistros}
              </p>
              <p className="text-xs text-muted-foreground">Mis Registros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle className="size-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{resueltos}</p>
              <p className="text-xs text-muted-foreground">Resueltos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {misRegistros - resueltos}
              </p>
              <p className="text-xs text-muted-foreground">Pendientes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Infractions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Mi Historial de Registros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Gravedad
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myInfracciones.map((inf) => {
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
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(inf.fecha)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={estado.className}>
                          {estado.label}
                        </Badge>
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
