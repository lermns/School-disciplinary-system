"use client"

import { useState } from "react"
import { Plus, Mail, Calendar } from "lucide-react"
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
import { mockUsuarios, mockInfracciones } from "@/lib/mock-data"
import { formatDate } from "@/lib/helpers"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

const profesores = mockUsuarios.filter((u) => u.rol === "profesor")

export default function ProfesoresPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const getInfraccionCount = (profId: string) =>
    mockInfracciones.filter((i) => i.profesor_id === profId).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Profesores
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión del personal docente
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="mr-2 size-4" />
              Nuevo Profesor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Profesor</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success("Profesor registrado exitosamente")
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
                <Input type="email" placeholder="correo@colegiodorado.edu" required />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input type="password" placeholder="Contraseña inicial" required />
              </div>
              <Button type="submit" className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
                Registrar Profesor
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
                  <TableHead>Profesor</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Infracciones Registradas</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha Creación</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profesores.map((prof) => (
                  <TableRow key={prof.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(prof.nombre_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{prof.nombre_completo}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="size-3.5" />
                        {prof.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getInfraccionCount(prof.id)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {formatDate(prof.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        Activo
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
