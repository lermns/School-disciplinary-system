"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajustes generales del sistema disciplinario
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del Colegio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Colegio</Label>
              <Input defaultValue="Colegio El Dorado" />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input defaultValue="Calle 100 #45-67, Bogotá" />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input defaultValue="+57 1 234 5678" />
            </div>
            <Button
              className="bg-gold text-gold-foreground hover:bg-gold/90"
              onClick={() => toast.success("Configuración guardada")}
            >
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle className="text-base">Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificar a padres</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar email al registrar una infracción
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificar infracciones graves</Label>
                <p className="text-xs text-muted-foreground">
                  Alerta inmediata para faltas graves y muy graves
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Resumen semanal</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar resumen semanal a administradores
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
