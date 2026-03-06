"use client"

import { FileDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
} from "recharts"
import {
  mockEstudiantes,
  mockUsuarios,
  mockInfracciones,
  getInfraccionesConDatos,
} from "@/lib/mock-data"
import { toast } from "sonner"

const infracciones = getInfraccionesConDatos()

// Monthly trend data (simulado)
const monthlyTrend = [
  { mes: "Jun", count: 3 },
  { mes: "Jul", count: 5 },
  { mes: "Ago", count: 2 },
  { mes: "Sep", count: 7 },
  { mes: "Oct", count: 4 },
  { mes: "Nov", count: 10 },
]

// Infracciones por curso
const cursoMap: Record<string, number> = {}
infracciones.forEach((inf) => {
  const curso = inf.estudiante?.curso || "N/A"
  cursoMap[curso] = (cursoMap[curso] || 0) + 1
})
const infraccionesPorCurso = Object.entries(cursoMap)
  .map(([curso, count]) => ({ curso, count }))
  .sort((a, b) => a.curso.localeCompare(b.curso))

// Top 10 estudiantes con más infracciones
const studentCountMap: Record<string, number> = {}
mockInfracciones.forEach((inf) => {
  studentCountMap[inf.estudiante_id] =
    (studentCountMap[inf.estudiante_id] || 0) + 1
})
const top10Students = Object.entries(studentCountMap)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([id, count], index) => ({
    rank: index + 1,
    student: mockEstudiantes.find((e) => e.id === id),
    count,
  }))

// Infracciones por regente (antes profesor)
const regenteCountMap: Record<string, number> = {}
mockInfracciones.forEach((inf) => {
  regenteCountMap[inf.regente_id] = (regenteCountMap[inf.regente_id] || 0) + 1
})
const infraccionesPorRegente = Object.entries(regenteCountMap)
  .map(([id, count]) => ({
    nombre: mockUsuarios.find((u) => u.id === id)?.nombre_completo || "N/A",
    count,
  }))
  .sort((a, b) => b.count - a.count)

const tooltipStyle = {
  backgroundColor: "oklch(1 0 0)",
  borderColor: "oklch(0.9 0.01 250)",
  borderRadius: "8px",
  fontSize: "12px",
}

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Reportes
          </h1>
          <p className="text-sm text-muted-foreground">
            Análisis y estadísticas del sistema disciplinario
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => toast.info("Función de exportación a PDF en desarrollo")}
        >
          <FileDown className="mr-2 size-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tendencia mensual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Tendencia Mensual de Infracciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Infracciones"
                    stroke="oklch(0.75 0.15 85)"
                    strokeWidth={2}
                    dot={{ fill: "oklch(0.75 0.15 85)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Por curso */}
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
                  <RechartsTooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="Infracciones"
                    fill="oklch(0.25 0.06 250)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top estudiantes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Top 10 Estudiantes con Más Infracciones
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead className="text-right">Infracciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {top10Students.map(({ rank, student, count }) => (
                  <TableRow key={student?.id}>
                    <TableCell className="font-bold text-muted-foreground">
                      {rank}
                    </TableCell>
                    <TableCell className="font-medium">
                      {student?.nombre_completo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {student?.curso} {student?.seccion}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive">
                        {count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Por regente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Infracciones por Regente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Regente</TableHead>
                  <TableHead className="text-right">Registradas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {infraccionesPorRegente.map((reg) => (
                  <TableRow key={reg.nombre}>
                    <TableCell className="font-medium">{reg.nombre}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{reg.count}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}