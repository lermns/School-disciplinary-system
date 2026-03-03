"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { mockTiposFalta, mockInfracciones } from "@/lib/mock-data"
import { getGravedadConfig } from "@/lib/helpers"

export default function TiposFaltaPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const getUsageCount = (tipoId: string) =>
    mockInfracciones.filter((i) => i.tipo_falta_id === tipoId).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Tipos de Falta
          </h1>
          <p className="text-sm text-muted-foreground">
            Configuración de categorías de faltas disciplinarias
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="mr-2 size-4" />
              Nueva Falta
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Tipo de Falta</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success("Tipo de falta registrado exitosamente")
                setDialogOpen(false)
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input placeholder="Nombre de la falta" required />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea placeholder="Descripción detallada..." required />
              </div>
              <div className="space-y-2">
                <Label>Gravedad</Label>
                <Select defaultValue="leve">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="grave">Grave</SelectItem>
                    <SelectItem value="muy_grave">Muy Grave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                Registrar Tipo de Falta
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockTiposFalta.map((tipo) => {
          const config = getGravedadConfig(tipo.gravedad)
          const usageCount = getUsageCount(tipo.id)

          return (
            <Card key={tipo.id} className="relative overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full w-1"
                style={{ backgroundColor: tipo.color }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tipo.nombre}</CardTitle>
                  <Badge variant="outline" className={config.className}>
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {tipo.descripcion}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Utilizada{" "}
                    <span className="font-semibold text-foreground">
                      {usageCount}
                    </span>{" "}
                    {usageCount === 1 ? "vez" : "veces"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
