"use client"

import { useState, useMemo } from "react"
import { mockEstudiantes, getRetrasoCount } from "@/lib/mock-data"
import type { Estudiante } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Clock, Users, AlertTriangle } from "lucide-react"
import { RegistrarInfraccionModal } from "@/components/regente/registrar-infraccion-modal"
import { useAuth } from "@/lib/auth-context"

const CURSOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"]

export default function RegenteDashboard() {
  const { user } = useAuth()
  const [search, setSearch] = useState("")
  const [filterCurso, setFilterCurso] = useState("all")
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const activos = useMemo(
    () => mockEstudiantes.filter((e) => e.activo),
    []
  )

  const filtered = useMemo(() => {
    return activos.filter((e) => {
      const matchSearch =
        !search ||
        e.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
        e.curso.toLowerCase().includes(search.toLowerCase())
      const matchCurso = filterCurso === "all" || e.curso === filterCurso
      return matchSearch && matchCurso
    })
  }, [activos, search, filterCurso])

  const abrirModal = (est: Estudiante) => {
    setEstudianteSeleccionado(est)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel del Regente</h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenido, <span className="font-medium text-gray-700">{user?.nombre_completo}</span> — registra infracciones leves
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activos.length}</p>
            <p className="text-xs text-gray-500">Estudiantes activos</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">4</p>
            <p className="text-xs text-gray-500">Tipos de falta disponibles</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 col-span-2 md:col-span-1 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Registro automático</p>
            <p className="text-xs text-gray-500">Fecha: hoy</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar estudiante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCurso} onValueChange={setFilterCurso}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Todos los cursos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los cursos</SelectItem>
            {CURSOS.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista de estudiantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            No se encontraron estudiantes
          </div>
        ) : (
          filtered.map((est) => {
            const retrasos = getRetrasoCount(est.id)
            return (
              <div
                key={est.id}
                onClick={() => abrirModal(est)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-[#0f1f3d]/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-[#0f1f3d] transition-colors truncate">
                      {est.nombre_completo}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {est.curso} — Sección {est.seccion}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs bg-[#0f1f3d]/5 text-[#0f1f3d] border-[#0f1f3d]/20"
                  >
                    Registrar falta
                  </Badge>
                </div>

                {/* Contador de retrasos */}
                <div className="mt-3 flex items-center gap-1.5">
                  <Clock className={`w-3.5 h-3.5 ${retrasos > 0 ? "text-amber-500" : "text-gray-300"}`} />
                  <span className={`text-xs font-medium ${retrasos > 0 ? "text-amber-600" : "text-gray-400"}`}>
                    {retrasos === 0
                      ? "Sin retrasos"
                      : `${retrasos} retraso${retrasos > 1 ? "s" : ""} acumulado${retrasos > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal registrar infracción */}
      {estudianteSeleccionado && (
        <RegistrarInfraccionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          estudiante={estudianteSeleccionado}
          regenteId={user!.id}
        />
      )}
    </div>
  )
}