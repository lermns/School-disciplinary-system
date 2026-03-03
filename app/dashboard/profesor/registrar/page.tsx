"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Send, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
import { getGravedadConfig } from "@/lib/helpers"
import { Badge } from "@/components/ui/badge"

export default function ProfesorRegistrarPage() {
  const { user } = useAuth()
  const [estudianteId, setEstudianteId] = useState("")
  const [tipoFaltaId, setTipoFaltaId] = useState("")
  const [fecha, setFecha] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [descripcion, setDescripcion] = useState("")
  const [sancion, setSancion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedTipo = mockTiposFalta.find((tf) => tf.id === tipoFaltaId)
  const estudiantesActivos = mockEstudiantes.filter((e) => e.activo)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!estudianteId || !tipoFaltaId || !descripcion || !sancion) {
      toast.error("Todos los campos son obligatorios")
      return
    }

    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const estudiante = mockEstudiantes.find((e) => e.id === estudianteId)
    toast.success(
      `Infraccion registrada para ${estudiante?.nombre_completo}`
    )

    setEstudianteId("")
    setTipoFaltaId("")
    setDescripcion("")
    setSancion("")
    setFecha(new Date().toISOString().split("T")[0])
    setIsSubmitting(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Registrar Infraccion
        </h1>
        <p className="text-sm text-muted-foreground">
          Complete el formulario para registrar una nueva infraccion
          disciplinaria.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-warning" />
              Nueva Infraccion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estudiante">Estudiante</Label>
                  <Select
                    value={estudianteId}
                    onValueChange={setEstudianteId}
                  >
                    <SelectTrigger id="estudiante">
                      <SelectValue placeholder="Seleccionar estudiante" />
                    </SelectTrigger>
                    <SelectContent>
                      {estudiantesActivos.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nombre_completo} ({e.curso} &quot;{e.seccion}
                          &quot;)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Falta</Label>
                  <Select
                    value={tipoFaltaId}
                    onValueChange={setTipoFaltaId}
                  >
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTiposFalta.map((tf) => {
                        const grav = getGravedadConfig(tf.gravedad)
                        return (
                          <SelectItem key={tf.id} value={tf.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className={`size-2 rounded-full ${grav.dotColor}`}
                              />
                              {tf.nombre}
                            </span>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripcion del Incidente</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describa detalladamente lo ocurrido..."
                  rows={4}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sancion">Sancion Aplicada</Label>
                <Textarea
                  id="sancion"
                  placeholder="Describa la sancion o medida disciplinaria..."
                  rows={2}
                  value={sancion}
                  onChange={(e) => setSancion(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                <Send className="mr-2 size-4" />
                {isSubmitting ? "Registrando..." : "Registrar Infraccion"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vista Previa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Profesor
              </p>
              <p className="text-sm font-medium text-foreground">
                {user?.nombre_completo}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Estudiante
              </p>
              <p className="text-sm font-medium text-foreground">
                {estudianteId
                  ? mockEstudiantes.find((e) => e.id === estudianteId)
                      ?.nombre_completo
                  : "Sin seleccionar"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Tipo de Falta
              </p>
              {selectedTipo ? (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {selectedTipo.nombre}
                  </p>
                  <Badge
                    variant="outline"
                    className={
                      getGravedadConfig(selectedTipo.gravedad).className
                    }
                  >
                    {getGravedadConfig(selectedTipo.gravedad).label}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin seleccionar
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Fecha
              </p>
              <p className="text-sm font-medium text-foreground">{fecha}</p>
            </div>
            {descripcion && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Descripcion
                </p>
                <p className="text-sm text-foreground line-clamp-3">
                  {descripcion}
                </p>
              </div>
            )}
            {sancion && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Sancion
                </p>
                <p className="text-sm text-foreground line-clamp-2">
                  {sancion}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
