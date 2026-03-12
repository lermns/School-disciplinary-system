"use client"

import { useEffect, useState } from "react"
import { fetchUsuarios, fetchInfracciones } from "@/lib/data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldCheck, FileText } from "lucide-react"
import type { Usuario, Infraccion } from "@/lib/types"

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

export default function AdminRegentePage() {
  const [regente, setRegente] = useState<Usuario | null>(null)
  const [infraccionesRegente, setInfraccionesRegente] = useState<Infraccion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchUsuarios(), fetchInfracciones()]).then(([usuarios, infs]) => {
      const r = usuarios.find(u => u.rol === "regente") ?? null
      setRegente(r)
      if (r) {
        setInfraccionesRegente(infs.filter(inf => inf.regente_id === r.id && inf.tipo_falta?.gravedad === "leve"))
      }
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando...</div>

  if (!regente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-2">
        <ShieldCheck className="w-12 h-12 opacity-30" />
        <p>No hay ningún regente registrado en el sistema.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Regente</h1>
        <p className="text-sm text-muted-foreground">Perfil y registro de infracciones leves</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{getInitials(regente.nombre_completo)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-bold text-gray-900 max-w-xs text-base">{regente.nombre_completo}</p>
          <p className="text-sm text-gray-900 max-w-xs">{regente.email}</p>
        </div>
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Regente</Badge>
      </div>

      <div>
        <h2 className="font-serif text-lg font-semibold text-foreground mb-3">
          Infracciones leves registradas
          <span className="ml-2 text-sm font-normal text-muted-foreground">({infraccionesRegente.length})</span>
        </h2>

        {infraccionesRegente.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-green-500" />
            </div>
            <p className="font-medium text-gray-700">Sin infracciones leves registradas</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-semibold text-gray-700">Estudiante</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tipo de Falta</TableHead>
                  <TableHead className="font-semibold text-gray-700">Fecha</TableHead>
                  <TableHead className="font-semibold text-gray-700">Descripción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {infraccionesRegente.map(inf => {
                  const g = getGravedadConfig(inf.tipo_falta!.gravedad)
                  return (
                    <TableRow key={inf.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Avatar className="size-7">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{inf.estudiante ? getInitials(inf.estudiante.nombre_completo) : "?"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{inf.estudiante?.nombre_completo}</p>
                            <p className="text-xs text-muted-foreground">{inf.estudiante?.curso} {inf.estudiante?.seccion}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 max-w-xs">{inf.tipo_falta?.nombre}</span>
                          <Badge variant="outline" className={`text-xs ${g.className}`}>{g.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 whitespace-nowrap">{formatDate(inf.fecha)}</TableCell>
                      <TableCell className="text-sm text-gray-900 max-w-xs"><span className="line-clamp-2">{inf.descripcion}</span></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}