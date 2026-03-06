"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { mockEstudiantes, mockTiposFalta } from "@/lib/mock-data"
import { toast } from "sonner"

// Solo el regente puede registrar faltas leves
const tiposFaltaLeves = mockTiposFalta.filter((tf) => tf.gravedad === "leve")

export default function RegenteRegistrarPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [estudianteId, setEstudianteId] = useState("")
  const [tipoFaltaId, setTipoFaltaId] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0])
  const [descripcion, setDescripcion] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!estudianteId || !tipoFaltaId || !fecha) {
      toast.error("Completa los campos obligatorios.")
      return
    }

    setLoading(true)
    // Simulación de guardado
    await new Promise((r) => setTimeout(r, 800))

    toast.success("Infracción registrada correctamente.")
    router.push("/dashboard/regente/historial")
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Registrar Infracción
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Solo puede registrar faltas leves. Las faltas graves y muy graves son
          gestionadas por la coordinación.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Datos de la Infracción
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Estudiante */}
          <div className="space-y-1.5">
            <Label htmlFor="estudiante">
              Estudiante <span className="text-destructive">*</span>
            </Label>
            <Select value={estudianteId} onValueChange={setEstudianteId}>
              <SelectTrigger id="estudiante">
                <SelectValue placeholder="Seleccionar estudiante..." />
              </SelectTrigger>
              <SelectContent>
                {mockEstudiantes
                  .filter((e) => e.activo)
                  .sort((a, b) =>
                    a.nombre_completo.localeCompare(b.nombre_completo)
                  )
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre_completo} — {e.curso} {e.seccion}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de falta (solo leves) */}
          <div className="space-y-1.5">
            <Label htmlFor="tipo">
              Tipo de Falta <span className="text-destructive">*</span>
            </Label>
            <Select value={tipoFaltaId} onValueChange={setTipoFaltaId}>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {tiposFaltaLeves.map((tf) => (
                  <SelectItem key={tf.id} value={tf.id}>
                    {tf.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="fecha">
              Fecha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fecha"
              type="date"
              value={fecha}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Detalle adicional sobre la infracción (opcional)..."
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* Regente (solo lectura) */}
          <div className="space-y-1.5">
            <Label>Registrado por</Label>
            <Input value={user?.nombre_completo ?? ""} disabled />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/regente/historial")}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          <CheckCircle2 className="mr-2 size-4" />
          {loading ? "Guardando..." : "Registrar Infracción"}
        </Button>
      </div>
    </div>
  )
}