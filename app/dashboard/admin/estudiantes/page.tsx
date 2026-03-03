"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Plus,
  Eye,
  History,
  User,
  MapPin,
  Calendar,
  BookOpen,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  mockEstudiantes,
  mockInfracciones,
  mockTiposFalta,
  mockUsuarios,
} from "@/lib/mock-data"
import { getGravedadConfig, getEstadoConfig, formatDate } from "@/lib/helpers"
import type { Estudiante } from "@/lib/types"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

const cursos = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const secciones = ["A", "B"]

export default function EstudiantesPage() {
  const [search, setSearch] = useState("")
  const [cursoFilter, setCursoFilter] = useState("all")
  const [selectedStudent, setSelectedStudent] = useState<Estudiante | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredStudents = useMemo(() => {
    return mockEstudiantes.filter((e) => {
      const matchesSearch = e.nombre_completo
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesCurso =
        cursoFilter === "all" ? true : e.curso === cursoFilter
      return matchesSearch && matchesCurso
    })
  }, [search, cursoFilter])

  const getStudentInfraccionCount = (id: string) =>
    mockInfracciones.filter((i) => i.estudiante_id === id).length

  const getStudentInfracciones = (id: string) =>
    mockInfracciones
      .filter((i) => i.estudiante_id === id)
      .map((inf) => ({
        ...inf,
        tipo_falta: mockTiposFalta.find((tf) => tf.id === inf.tipo_falta_id),
        profesor: mockUsuarios.find((u) => u.id === inf.profesor_id),
      }))

  const handleRowClick = (student: Estudiante) => {
    setSelectedStudent(student)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            Estudiantes
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestión del directorio de estudiantes
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gold text-gold-foreground hover:bg-gold/90">
              <Plus className="mr-2 size-4" />
              Nuevo Estudiante
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Estudiante</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success("Estudiante registrado exitosamente")
                setDialogOpen(false)
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input placeholder="Nombre completo del estudiante" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Curso</Label>
                  <Select defaultValue="4to">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cursos.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sección</Label>
                  <Select defaultValue="A">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {secciones.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha de Nacimiento</Label>
                <Input type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Textarea placeholder="Dirección completa" />
              </div>
              <Button
                type="submit"
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90"
              >
                Registrar Estudiante
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={cursoFilter} onValueChange={setCursoFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Curso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los cursos</SelectItem>
              {cursos.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Infracciones
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const count = getStudentInfraccionCount(student.id)
                  return (
                    <TableRow
                      key={student.id}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(student)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {getInitials(student.nombre_completo)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {student.nombre_completo}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.curso} {student.seccion}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={count > 0 ? "destructive" : "secondary"}
                          className={
                            count > 0
                              ? "bg-destructive/10 text-destructive"
                              : ""
                          }
                        >
                          {count}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={
                            student.activo
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {student.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(student)
                            }}
                            aria-label="Ver detalle"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(student)
                            }}
                            aria-label="Ver historial"
                          >
                            <History className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Student Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg p-0">
          {selectedStudent && (
            <>
              <SheetHeader className="p-6 pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                      {getInitials(selectedStudent.nombre_completo)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-lg">
                      {selectedStudent.nombre_completo}
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedStudent.curso} - Sección{" "}
                      {selectedStudent.seccion}
                    </p>
                    <Badge
                      variant="outline"
                      className={
                        selectedStudent.activo
                          ? "mt-1 bg-success/10 text-success border-success/20"
                          : "mt-1 bg-muted text-muted-foreground"
                      }
                    >
                      {selectedStudent.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <Tabs defaultValue="info" className="px-6">
                <TabsList className="w-full">
                  <TabsTrigger value="info" className="flex-1">
                    Información
                  </TabsTrigger>
                  <TabsTrigger value="historial" className="flex-1">
                    Historial
                  </TabsTrigger>
                  <TabsTrigger value="contacto" className="flex-1">
                    Contacto
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-4 space-y-4 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Calendar className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Fecha de nacimiento
                        </p>
                        <p className="text-sm font-medium">
                          {formatDate(selectedStudent.fecha_nacimiento)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <BookOpen className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Curso / Sección
                        </p>
                        <p className="text-sm font-medium">
                          {selectedStudent.curso} -{" "}
                          {selectedStudent.seccion}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Dirección
                      </p>
                      <p className="text-sm font-medium">
                        {selectedStudent.direccion}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Registrado
                      </p>
                      <p className="text-sm font-medium">
                        {formatDate(selectedStudent.created_at)}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="historial" className="mt-4 space-y-3 pb-6">
                  {getStudentInfracciones(selectedStudent.id).length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No hay infracciones registradas
                    </p>
                  ) : (
                    getStudentInfracciones(selectedStudent.id).map((inf) => {
                      const gravedad = inf.tipo_falta
                        ? getGravedadConfig(inf.tipo_falta.gravedad)
                        : null
                      const estado = getEstadoConfig(inf.estado)

                      return (
                        <div
                          key={inf.id}
                          className="rounded-lg border border-border p-4 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {inf.tipo_falta?.nombre}
                            </span>
                            <div className="flex gap-2">
                              {gravedad && (
                                <Badge
                                  variant="outline"
                                  className={gravedad.className}
                                >
                                  {gravedad.label}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={estado.className}
                              >
                                {estado.label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {inf.descripcion}
                          </p>
                          <Separator />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Prof. {inf.profesor?.nombre_completo}
                            </span>
                            <span>{formatDate(inf.fecha)}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </TabsContent>

                <TabsContent value="contacto" className="mt-4 space-y-4 pb-6">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground">
                      Acudiente / Padre
                    </p>
                    <p className="text-sm font-medium">
                      Pedro Rodríguez
                    </p>
                    <p className="text-xs text-muted-foreground">
                      padre.rodriguez@gmail.com
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
