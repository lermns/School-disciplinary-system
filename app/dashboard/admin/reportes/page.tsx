"use client"

import { useEffect, useState, useMemo } from "react"
import { fetchInfracciones, fetchEstudiantes } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Line, LineChart, Tooltip as RechartsTooltip,
} from "recharts"
import type { Infraccion, Estudiante } from "@/lib/types"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

const tooltipStyle = {
  backgroundColor: "oklch(1 0 0)",
  borderColor: "oklch(0.9 0.01 250)",
  borderRadius: "8px",
  fontSize: "12px",
}

export default function ReportesPage() {
  const [infracciones, setInfracciones] = useState<Infraccion[]>([])
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchInfracciones(), fetchEstudiantes()]).then(([infs, ests]) => {
      setInfracciones(infs)
      setEstudiantes(ests)
      setLoading(false)
    })
  }, [])

  // Tendencia mensual — año actual
  const tendenciaMensual = useMemo(() => {
    const anioActual = new Date().getFullYear()
    const conteo = Array(12).fill(0)
    infracciones.forEach(inf => {
      const fecha = new Date(inf.fecha)
      if (fecha.getFullYear() === anioActual) {
        conteo[fecha.getMonth()]++
      }
    })
    return MESES.map((mes, i) => ({ mes, count: conteo[i] }))
  }, [infracciones])

  // Infracciones por curso
  const infraccionesPorCurso = useMemo(() => {
    const m: Record<string, number> = {}
    infracciones.forEach(inf => {
      const c = inf.estudiante?.curso ?? "N/A"
      m[c] = (m[c] ?? 0) + 1
    })
    return Object.entries(m)
      .map(([curso, count]) => ({ curso, count }))
      .sort((a, b) => a.curso.localeCompare(b.curso))
  }, [infracciones])

  // Top 10 estudiantes con más infracciones
  const top10 = useMemo(() => {
    const m: Record<string, number> = {}
    infracciones.forEach(inf => {
      m[inf.estudiante_id] = (m[inf.estudiante_id] ?? 0) + 1
    })
    return Object.entries(m)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([estudianteId, count], i) => ({
        rank: i + 1,
        estudiante: estudiantes.find(e => e.id === estudianteId),
        count,
      }))
      .filter(r => r.estudiante) // solo los que tienen datos
  }, [infracciones, estudiantes])

  // Stats rápidas
  const totalLeves = infracciones.filter(i => i.tipo_falta?.gravedad === "leve").length
  const totalGraves = infracciones.filter(i => i.tipo_falta?.gravedad === "grave").length
  const totalMuyGraves = infracciones.filter(i => i.tipo_falta?.gravedad === "muy_grave").length

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando reportes...</div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">Análisis y estadísticas del sistema disciplinario</p>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total infracciones", value: infracciones.length, color: "text-foreground" },
          { label: "Faltas leves", value: totalLeves, color: "text-success" },
          { label: "Faltas graves", value: totalGraves, color: "text-warning" },
          { label: "Muy graves", value: totalMuyGraves, color: "text-destructive" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Tendencia Mensual {new Date().getFullYear()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tendenciaMensual}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Infracciones por Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {infraccionesPorCurso.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin datos</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={infraccionesPorCurso}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="curso" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <RechartsTooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" name="Infracciones" fill="oklch(0.25 0.06 250)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 estudiantes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Top 10 Estudiantes con Más Infracciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {top10.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Sin infracciones registradas aún</div>
          ) : (
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
                {top10.map(({ rank, estudiante, count }) => (
                  <TableRow key={estudiante!.id}>
                    <TableCell className="font-bold text-muted-foreground">{rank}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(estudiante!.nombre_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{estudiante!.nombre_completo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {estudiante!.curso} {estudiante!.seccion}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive dark:bg-red-900/40 dark:text-red-300">
                        {count}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}