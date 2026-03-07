"use client"

import { useMemo } from "react"
import { mockUsuarios, getInfraccionesConDatos } from "@/lib/mock-data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldCheck, FileText } from "lucide-react"

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

export default function AdminRegentePage() {
  const regente = useMemo(() => mockUsuarios.find(u => u.rol === "regente") ?? null, [])

  const infraccionesRegente = useMemo(() => {
    if (!regente) return []
    return getInfraccionesConDatos().filter(
      inf => inf.regente_id === regente.id && inf.tipo_falta?.gravedad === "leve"
    )
  }, [regente])

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

      {/* Perfil */}
      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              RG
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-bold text-foreground text-base">Regente Modulo El Dorado</p>
            <p className="text-sm text-muted-foreground">202602</p>
          </div>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Regente
          </Badge>
        </CardContent>
      </Card>

      {/* Infracciones leves registradas */}
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
                  const gravedadCfg = getGravedadConfig(inf.tipo_falta!.gravedad)
                  return (
                    <TableRow key={inf.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-900">
                          <Avatar className="size-7">
                            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold ">
                              {inf.estudiante ? getInitials(inf.estudiante.nombre_completo) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{inf.estudiante?.nombre_completo}</p>
                            <p className="text-xs text-muted-foreground">{inf.estudiante?.curso} {inf.estudiante?.seccion}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-gray-900">
                          <span className="text-sm">{inf.tipo_falta?.nombre}</span>
                          <Badge variant="outline" className={`text-xs ${gravedadCfg.className}`}>{gravedadCfg.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900 whitespace-nowrap ">{formatDate(inf.fecha)}</TableCell>
                      <TableCell className="text-sm text-gray-900 max-w-xs">
                        <span className="line-clamp-2">{inf.descripcion}</span>
                      </TableCell>
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