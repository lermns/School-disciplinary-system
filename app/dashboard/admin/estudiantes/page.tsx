"use client"

import { useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { mockEstudiantes, getEstudianteInfracciones, getRetrasoCount } from "@/lib/mock-data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, FileText, AlertTriangle, UserCircle, BookOpen, CalendarDays } from "lucide-react"
import type { Infraccion } from "@/lib/types"

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

type InfRow = Infraccion

// Dialog de detalle reutilizable
function InfraccionDialog({ selected, onClose }: { selected: InfRow | null; onClose: () => void }) {
  const gravedad = selected?.tipo_falta ? getGravedadConfig(selected.tipo_falta.gravedad) : null
  return (
    <Dialog open={!!selected} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Detalle de infracción</DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-4 pt-1">
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
        )}
      </DialogContent>
    </Dialog>
  )
}

// Dialog de lista por categoría, con click en cada item para ver detalle
function ListaInfraccionesDialog({
  titulo,
  infracciones,
  open,
  onClose,
}: {
  titulo: string
  infracciones: InfRow[]
  open: boolean
  onClose: () => void
}) {
  const [selectedDetalle, setSelectedDetalle] = useState<InfRow | null>(null)

  return (
    <>
      <Dialog open={open} onOpenChange={o => !o && onClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{titulo}</DialogTitle>
          </DialogHeader>
          {infracciones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin registros.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pt-1 pr-1">
              {infracciones.map(inf => {
                const gravedadCfg = inf.tipo_falta ? getGravedadConfig(inf.tipo_falta.gravedad) : null
                return (
                  <button
                    key={inf.id}
                    onClick={() => setSelectedDetalle(inf)}
                    className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{inf.tipo_falta?.nombre ?? "—"}</p>
                      {gravedadCfg && (
                        <Badge variant="outline" className={`text-xs shrink-0 ${gravedadCfg.className}`}>{gravedadCfg.label}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(inf.fecha)}</p>
                    {inf.descripcion && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{inf.descripcion}</p>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <InfraccionDialog selected={selectedDetalle} onClose={() => setSelectedDetalle(null)} />
    </>
  )
}

export default function EstudianteDashboard() {
  const { user } = useAuth()

  const estudiante = useMemo(() => {
    if (!user?.estudiante_id) return null
    return mockEstudiantes.find(e => e.id === user.estudiante_id) ?? null
  }, [user])

  const infracciones = useMemo(() => {
    if (!estudiante) return []
    return getEstudianteInfracciones(estudiante.id)
  }, [estudiante])

  const retrasos = useMemo(() => {
    if (!estudiante) return 0
    return getRetrasoCount(estudiante.id)
  }, [estudiante])

  // Estado para los dialogs de lista
  const [listaAbierta, setListaAbierta] = useState<null | "retrasos" | "faltas" | "leves" | "graves" | "muy_graves">(null)
  // Estado para detalle directo desde historial
  const [selectedDetalle, setSelectedDetalle] = useState<InfRow | null>(null)

  const infRetrasos = useMemo(() => infracciones.filter(i => i.tipo_falta_id === "tf1"), [infracciones])
  const infFaltas = useMemo(() => infracciones.filter(i => i.tipo_falta_id === "tf2"), [infracciones])
  const infLeves = useMemo(() => infracciones.filter(i => i.tipo_falta?.gravedad === "leve"), [infracciones])
  const infGraves = useMemo(() => infracciones.filter(i => i.tipo_falta?.gravedad === "grave"), [infracciones])
  const infMuyGraves = useMemo(() => infracciones.filter(i => i.tipo_falta?.gravedad === "muy_grave"), [infracciones])

  if (!estudiante) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <UserCircle className="w-12 h-12" />
        <p>No se encontró el perfil de estudiante vinculado a tu cuenta.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 bg-[#0f1f3d]/10 rounded-full flex items-center justify-center shrink-0">
          <UserCircle className="w-9 h-9 text-[#0f1f3d]" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{estudiante.nombre_completo}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{estudiante.curso} — Sección {estudiante.seccion}</p>
          <p className="text-gray-400 text-xs mt-0.5">{estudiante.direccion}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium ${retrasos > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
          <Clock className="w-4 h-4" />
          <span>{retrasos} retraso{retrasos !== 1 ? "s" : ""} acumulado{retrasos !== 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Stats — clickeables */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total infracciones */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{infracciones.length}</p>
            <p className="text-xs text-gray-500">Total infracciones</p>
          </div>
        </div>

        {/* Retrasos — clickeable */}
        <button
          onClick={() => setListaAbierta("retrasos")}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 hover:border-amber-300 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{retrasos}</p>
            <p className="text-xs text-gray-500">Retrasos</p>
          </div>
        </button>

        {/* Faltas graves — clickeable */}
        <button
          onClick={() => setListaAbierta("graves")}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-2 md:col-span-1 flex items-center gap-3 hover:border-red-300 hover:shadow-md transition-all text-left"
        >
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {infracciones.filter(i => i.tipo_falta?.gravedad === "grave" || i.tipo_falta?.gravedad === "muy_grave").length}
            </p>
            <p className="text-xs text-gray-500">Faltas graves</p>
          </div>
        </button>
      </div>

      {/* Badges adicionales clickeables */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setListaAbierta("leves")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors"
        >
          <span>Faltas leves</span>
          <span className="font-bold">{infLeves.length}</span>
        </button>
        <button
          onClick={() => setListaAbierta("graves")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors"
        >
          <span>Faltas graves</span>
          <span className="font-bold">{infGraves.length}</span>
        </button>
        <button
          onClick={() => setListaAbierta("muy_graves")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors"
        >
          <span>Faltas muy graves</span>
          <span className="font-bold">{infMuyGraves.length}</span>
        </button>
        <button
          onClick={() => setListaAbierta("faltas")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <span>Faltas</span>
          <span className="font-bold">{infFaltas.length}</span>
        </button>
      </div>

      {/* Historial completo */}
      <div>
        <h2 className="font-serif text-xl font-bold text-foreground mb-4">Historial de infracciones</h2>
        {infracciones.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-green-500" />
            </div>
            <p className="font-medium text-gray-700">Sin infracciones registradas</p>
            <p className="text-gray-400 text-sm mt-1">¡Excelente comportamiento!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {infracciones.map(inf => {
              const gravedadCfg = getGravedadConfig(inf.tipo_falta!.gravedad)
              // Punto 3: mostrar "Admin" o "Regente" según el rol
              const registradoPor = inf.regente?.rol === "admin" ? "Admin" : "Regente"
              return (
                <button
                  key={inf.id}
                  onClick={() => setSelectedDetalle(inf)}
                  className="w-full text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-start gap-3 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div
                    className="w-1 self-stretch rounded-full shrink-0 hidden sm:block"
                    style={{ backgroundColor: inf.tipo_falta?.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{inf.tipo_falta?.nombre}</p>
                      <Badge variant="outline" className={`text-xs ${gravedadCfg.className}`}>{gravedadCfg.label}</Badge>
                    </div>
                    {inf.descripcion && <p className="text-gray-600 text-sm">{inf.descripcion}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{formatDate(inf.fecha)}</span>
                      <span>·</span>
                      {/* Punto 3 */}
                      <span>Registrado por {registradoPor}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Dialogs de lista por categoría */}
      <ListaInfraccionesDialog titulo={`Retrasos (${infRetrasos.length})`} infracciones={infRetrasos} open={listaAbierta === "retrasos"} onClose={() => setListaAbierta(null)} />
      <ListaInfraccionesDialog titulo={`Faltas (${infFaltas.length})`} infracciones={infFaltas} open={listaAbierta === "faltas"} onClose={() => setListaAbierta(null)} />
      <ListaInfraccionesDialog titulo={`Faltas leves (${infLeves.length})`} infracciones={infLeves} open={listaAbierta === "leves"} onClose={() => setListaAbierta(null)} />
      <ListaInfraccionesDialog titulo={`Faltas graves (${infGraves.length})`} infracciones={infGraves} open={listaAbierta === "graves"} onClose={() => setListaAbierta(null)} />
      <ListaInfraccionesDialog titulo={`Faltas muy graves (${infMuyGraves.length})`} infracciones={infMuyGraves} open={listaAbierta === "muy_graves"} onClose={() => setListaAbierta(null)} />

      {/* Dialog de detalle individual desde historial */}
      <InfraccionDialog selected={selectedDetalle} onClose={() => setSelectedDetalle(null)} />
    </div>
  )
}