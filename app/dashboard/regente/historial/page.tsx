"use client"

import { useState, useMemo, useEffect } from "react"
import { fetchInfracciones } from "@/lib/data"
import { Search, CalendarDays, BookOpen, FileText, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import type { Infraccion } from "@/lib/types"

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function RegistradorBadge({ inf, size = "sm" }: { inf: Infraccion; size?: "sm" | "md" }) {
  const px = size === "sm" ? "px-1" : "px-1.5"
  const rol = inf.regente?.rol
  if (rol === "admin")
    return <Badge variant="outline" className={`text-[10px] ${px} py-0 bg-blue-50 text-blue-600 border-blue-200`}>Admin</Badge>
  if (rol === "profesor")
    return <Badge variant="outline" className={`text-[10px] ${px} py-0 bg-indigo-50 text-indigo-700 border-indigo-200`}>
      Prof. {inf.regente!.nombre_completo.split(" ")[0]}
    </Badge>
  return <Badge variant="outline" className={`text-[10px] ${px} py-0 bg-purple-50 text-purple-600 border-purple-200`}>Regente</Badge>
}

export default function RegenteHistorialPage() {
  const [infracciones, setInfracciones] = useState<Infraccion[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterGravedad, setFilterGravedad] = useState("all")
  const [selected, setSelected] = useState<Infraccion | null>(null)

  useEffect(() => {
    fetchInfracciones().then(data => { setInfracciones(data); setLoading(false) })
  }, [])

  const filtered = useMemo(() => infracciones.filter(inf => {
    const matchSearch = search === "" || inf.estudiante?.nombre_completo.toLowerCase().includes(search.toLowerCase()) || inf.tipo_falta?.nombre.toLowerCase().includes(search.toLowerCase()) || inf.descripcion.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filterGravedad === "all" || inf.tipo_falta?.gravedad === filterGravedad)
  }), [infracciones, search, filterGravedad])

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando historial...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Historial de Infracciones</h1>
        <p className="text-sm text-muted-foreground">Todas las infracciones registradas en el sistema.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por estudiante, tipo o descripción..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filterGravedad} onValueChange={setFilterGravedad}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Gravedad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las gravedades</SelectItem>
              <SelectItem value="leve">Leve</SelectItem>
              <SelectItem value="grave">Grave</SelectItem>
              <SelectItem value="muy_grave">Muy Grave</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">{filtered.length} registro{filtered.length !== 1 ? "s" : ""}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Tipo de Falta</TableHead>
                  <TableHead>Gravedad</TableHead>
                  <TableHead className="hidden md:table-cell">Registrado por</TableHead>
                  <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                  <TableHead className="hidden xl:table-cell">Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">{infracciones.length === 0 ? "No hay infracciones registradas aún." : "No se encontraron registros."}</TableCell></TableRow>
                ) : filtered.map(inf => {
                  const g = inf.tipo_falta ? getGravedadConfig(inf.tipo_falta.gravedad) : null
                  return (
                    <TableRow key={inf.id} className="cursor-pointer hover:bg-muted/60" onClick={() => setSelected(inf)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7"><AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{inf.estudiante ? getInitials(inf.estudiante.nombre_completo) : "?"}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium">{inf.estudiante?.nombre_completo}</p><p className="text-xs text-muted-foreground">{inf.estudiante?.curso} {inf.estudiante?.seccion}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{inf.tipo_falta?.nombre}</TableCell>
                      <TableCell>{g && <Badge variant="outline" className={g.className}>{g.label}</Badge>}</TableCell>
                      <TableCell className="hidden md:table-cell"><RegistradorBadge inf={inf} size="sm" /></TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground lg:table-cell whitespace-nowrap">{formatDate(inf.fecha)}</TableCell>
                      <TableCell className="hidden max-w-[250px] truncate text-sm text-muted-foreground xl:table-cell">{inf.descripcion}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Detalle de infracción</DialogTitle></DialogHeader>
          {selected && (() => {
            const g = selected.tipo_falta ? getGravedadConfig(selected.tipo_falta.gravedad) : null
            return (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="size-10"><AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{selected.estudiante ? getInitials(selected.estudiante.nombre_completo) : "?"}</AvatarFallback></Avatar>
                  <div><p className="font-semibold text-sm">{selected.estudiante?.nombre_completo}</p><p className="text-xs text-muted-foreground">{selected.estudiante?.curso} — Sección {selected.estudiante?.seccion}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2"><BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Tipo de falta</p><p className="font-medium">{selected.tipo_falta?.nombre ?? "—"}</p></div></div>
                  <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Fecha</p><p className="font-medium">{formatDate(selected.fecha)}</p></div></div>
                </div>
                {g && <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Gravedad:</span><Badge variant="outline" className={g.className}>{g.label}</Badge></div>}
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Registrado por</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-sm font-medium">{selected.regente?.nombre_completo ?? "—"}</p>
                      <RegistradorBadge inf={selected} size="md" />
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2"><FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground mb-1">Descripción</p><p className="text-sm leading-relaxed">{selected.descripcion || "Sin descripción."}</p></div></div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}