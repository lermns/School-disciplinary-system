"use client"

import { useMemo, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchInfraccionesByEstudiante } from "@/lib/data"
import { createClient } from "@/lib/supabase"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, AlertTriangle, UserCircle } from "lucide-react"
import type { Infraccion, Estudiante } from "@/lib/types"

export default function EstudianteDashboard() {
  const { user } = useAuth()
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null)
  const [infracciones, setInfracciones] = useState<Infraccion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.estudiante_id) { setLoading(false); return }
    const supabase = createClient()
    Promise.all([
      supabase.from("estudiantes").select("*").eq("id", user.estudiante_id).single(),
      fetchInfraccionesByEstudiante(user.estudiante_id),
    ]).then(([{ data }, infs]) => {
      setEstudiante(data as Estudiante)
      setInfracciones(infs)
      setLoading(false)
    })
  }, [user])

  const retrasos = useMemo(() => infracciones.filter(i => i.tipo_falta?.nombre === "Retraso").length, [infracciones])

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando...</div>

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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{infracciones.length}</p><p className="text-xs text-gray-500">Total infracciones</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{retrasos}</p><p className="text-xs text-gray-500">Retrasos</p></div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-2 md:col-span-1 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{infracciones.filter(i => i.tipo_falta?.gravedad === "grave" || i.tipo_falta?.gravedad === "muy_grave").length}</p>
            <p className="text-xs text-gray-500">Faltas Graves</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-serif text-xl font-bold text-foreground mb-4">Historial de infracciones</h2>
        {infracciones.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3"><FileText className="w-6 h-6 text-green-500" /></div>
            <p className="font-medium text-gray-700">Sin infracciones registradas</p>
            <p className="text-gray-400 text-sm mt-1">¡Excelente comportamiento!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {infracciones.map(inf => {
              const g = getGravedadConfig(inf.tipo_falta!.gravedad)
              return (
                <div key={inf.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="w-1 self-stretch rounded-full shrink-0 hidden sm:block" style={{ backgroundColor: inf.tipo_falta?.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{inf.tipo_falta?.nombre}</p>
                      <Badge variant="outline" className={`text-xs ${g.className}`}>{g.label}</Badge>
                    </div>
                    {inf.descripcion && <p className="text-gray-600 text-sm">{inf.descripcion}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{formatDate(inf.fecha)}</span>
                      <span>·</span>
                      <span>Registrado por {inf.regente?.rol === "profesor" ? `Prof. ${inf.regente!.nombre_completo.split(" ")[0]}` : inf.regente?.rol === "regente" ? "Regente" : "Admin"}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}