"use client"

import { useState } from "react"
import { Plus, Link2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  mockUsuarios,
  mockEstudiantes,
  mockPadresEstudiantes,
} from "@/lib/mock-data"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

const padres = mockUsuarios.filter((u) => u.rol === "padre")

function getLinkedChildren(padreId: string) {
  const links = mockPadresEstudiantes.filter((pe) => pe.usuario_id === padreId)
  return links
    .map((link) => mockEstudiantes.find((e) => e.id === link.estudiante_id))
    .filter(Boolean)
}

export default function PadresPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Padres de Familia
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión de padres y acudientes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="mr-2 size-4" />
              Nuevo Padre
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Padre</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success("Padre registrado exitosamente")
                setDialogOpen(false)
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input placeholder="Nombre completo" required />
              </div>
              <div className="space-y-2">
                <Label>Correo Electrónico</Label>
                <Input type="email" placeholder="correo@ejemplo.com" required />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input type="password" placeholder="Contraseña inicial" required />
              </div>
              <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                Registrar Padre
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Padre / Acudiente</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Hijos Vinculados</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {padres.map((padre) => {
                  const children = getLinkedChildren(padre.id)
                  return (
                    <TableRow key={padre.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(padre.nombre_completo)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {padre.nombre_completo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {padre.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {children.map((child) => (
                            <Badge
                              key={child!.id}
                              variant="secondary"
                              className="text-xs"
                            >
                              {child!.nombre_completo.split(" ")[0]} -{" "}
                              {child!.curso}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toast.info("Función de vincular hijo")}
                        >
                          <Link2 className="mr-1 size-3.5" />
                          Vincular
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
