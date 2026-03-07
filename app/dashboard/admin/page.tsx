"use client"

import {
  Users,
  AlertTriangle,
  XCircle,
  ShieldAlert,
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
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import {
  mockEstudiantes,
  getInfraccionesConDatos,
} from "@/lib/mock-data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"

const infracciones = getInfraccionesConDatos()

// Stats
const totalEstudiantes = mockEstudiantes.filter((e) => e.activo).length
const infraccionesTotal = infracciones.length
const infraccionesMuyGraves = infracciones.filter(
  (i) => i.tipo_falta?.gravedad === "muy_grave"
).length
const infraccionesGraves = infracciones.filter(
  (i) => i.tipo_falta?.gravedad === "grave"
).length

// Chart data: infracciones por curso
const cursoMap: Record<string, number> = {}
infracciones.forEach((inf) => {
  const curso = inf.estudiante?.curso || "N/A"
  cursoMap[curso] = (cursoMap[curso] || 0) + 1
})
const infraccionesPorCurso = Object.entries(cursoMap)
  .map(([curso, count]) => ({ curso, count }))
  .sort((a, b) => a.curso.localeCompare(b.curso))

// Chart data: distribución por tipo
const tipoMap: Record<string, number> = {}
infracciones.forEach((inf) => {
  const tipo = inf.tipo_falta?.nombre || "Otro"
  tipoMap[tipo] = (tipoMap[tipo] || 0) + 1
})
const distribucionTipo = Object.entries(tipoMap).map(([name, value]) => ({
  name,
  value,
}))
const PIE_COLORS = [
  "oklch(0.75 0.15 85)",
  "oklch(0.25 0.06 250)",
  "oklch(0.55 0.15 145)",
  "oklch(0.577 0.245 27.325)",
  "oklch(0.6 0.118 184.704)",
  "oklch(0.5 0.1 300)",
]

const stats = [
  {
    label: "Total Estudiantes",
    value: totalEstudiantes,
    icon: Users,
    iconBg: "bg-chart-2/10",
    iconColor: "text-chart-2",
  },
  {
    label: "Infracciones registradas",
    value: infraccionesTotal,
    icon: AlertTriangle,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  {
    label: "Faltas graves",
    value: infraccionesGraves,
    icon: ShieldAlert,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  {
    label: "Faltas muy graves",
    value: infraccionesMuyGraves,
    icon: XCircle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del sistema disciplinario
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
              >
                <stat.icon className={`size-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Infracciones por Curso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={infraccionesPorCurso}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="curso" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      borderColor: "oklch(0.9 0.01 250)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" name="Infracciones" fill="oklch(0.75 0.15 85)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Distribución por Tipo de Falta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribucionTipo}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {distribucionTipo.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      borderColor: "oklch(0.9 0.01 250)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Infractions Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Infracciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="hidden sm:table-cell">Curso</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Gravedad</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {infracciones.slice(0, 10).map((inf) => {
                  const gravedad = inf.tipo_falta
                    ? getGravedadConfig(inf.tipo_falta.gravedad)
                    : null

                  return (
                    <TableRow key={inf.id}>
                      <TableCell className="font-medium">
                        {inf.estudiante?.nombre_completo}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {inf.estudiante?.curso} {inf.estudiante?.seccion}
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
                      <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                        {formatDate(inf.fecha)}
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