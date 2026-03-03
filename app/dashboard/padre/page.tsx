"use client"

import {
  Heart,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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

export default function PadreDashboard() {
  const { user } = useAuth()

  if (!user) return null

  const hijos = getHijosDelPadre(user.id)

  const allInfracciones = hijos.flatMap((hijo) =>
    getEstudianteInfracciones(hijo.id).map((inf) => ({
      ...inf,
      tipo_falta: mockTiposFalta.find((tf) => tf.id === inf.tipo_falta_id),
      profesor: mockUsuarios.find((u) => u.id === inf.profesor_id),
    }))
  )

  const pendientes = allInfracciones.filter(
    (i) => i.estado === "pendiente"
  ).length
  const resueltos = allInfracciones.filter(
    (i) => i.estado === "resuelto"
  ).length
  const apelados = allInfracciones.filter(
    (i) => i.estado === "apelado"
  ).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Mis Hijos
        </h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido/a, {user.nombre_completo}. Aqui puede ver la situacion
          disciplinaria de sus hijos.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Heart className="size-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {hijos.length}
              </p>
              <p className="text-xs text-muted-foreground">Hijos Registrados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/10">
              <Clock className="size-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendientes}</p>
              <p className="text-xs text-muted-foreground">
                Faltas Pendientes
              </p>
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
              <p className="text-xs text-muted-foreground">Faltas Resueltas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{apelados}</p>
              <p className="text-xs text-muted-foreground">En Apelacion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {hijos.map((hijo) => {
          const infracciones = getEstudianteInfracciones(hijo.id)
          const hijoPendientes = infracciones.filter(
            (i) => i.estado === "pendiente"
          ).length
          const hijoTotal = infracciones.length

          return (
            <Card key={hijo.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {getInitials(hijo.nombre_completo)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">
                        {hijo.nombre_completo}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {hijo.curso} "{hijo.seccion}" &mdash;{" "}
                        {hijo.activo ? (
                          <span className="text-success">Activo</span>
                        ) : (
                          <span className="text-destructive">Inactivo</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {hijoTotal}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Faltas
                      </p>
                    </div>
                    {hijoPendientes > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-warning/10 text-warning border-warning/20"
                      >
                        {hijoPendientes} pend.
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {infracciones.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Sin infracciones registradas. Excelente comportamiento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {infracciones.slice(0, 3).map((inf) => {
                      const tipo = mockTiposFalta.find(
                        (tf) => tf.id === inf.tipo_falta_id
                      )
                      const gravedad = tipo
                        ? getGravedadConfig(tipo.gravedad)
                        : null
                      const estado = getEstadoConfig(inf.estado)

                      return (
                        <div
                          key={inf.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-foreground">
                                {tipo?.nombre}
                              </p>
                              {gravedad && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${gravedad.className}`}
                                >
                                  {gravedad.label}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(inf.fecha)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`ml-2 shrink-0 text-[10px] ${estado.className}`}
                          >
                            {estado.label}
                          </Badge>
                        </div>
                      )
                    })}
                    {infracciones.length > 3 && (
                      <p className="text-center text-xs text-muted-foreground">
                        +{infracciones.length - 3} mas
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Full History Table */}
      {allInfracciones.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Historial Completo de Faltas
            </CardTitle>
            <Link href="/dashboard/padre/mis-hijos">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Ver todo <ChevronRight className="size-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estudiante</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Tipo de Falta
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Gravedad
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Fecha
                    </TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allInfracciones.slice(0, 5).map((inf) => {
                    const estudiante = hijos.find(
                      (h) => h.id === inf.estudiante_id
                    )
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
                                {estudiante
                                  ? getInitials(estudiante.nombre_completo)
                                  : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {estudiante?.nombre_completo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm sm:table-cell">
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
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
