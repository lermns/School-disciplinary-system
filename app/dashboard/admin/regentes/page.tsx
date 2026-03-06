"use client"

import { useState } from "react"
import { mockUsuarios } from "@/lib/mock-data"
import type { Usuario } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Search, UserCircle, AlertTriangle } from "lucide-react"

const emptyForm = { nombre_completo: "", email: "" }

export default function AdminRegentesPage() {
  const [regentes, setRegentes] = useState<Usuario[]>(
    mockUsuarios.filter((u) => u.rol === "regente")
  )
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [eliminando, setEliminando] = useState<Usuario | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = regentes.filter(
    (r) =>
      !search ||
      r.nombre_completo.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
  )

  const abrirNuevo = () => {
    setEditando(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  const abrirEditar = (r: Usuario) => {
    setEditando(r)
    setForm({ nombre_completo: r.nombre_completo, email: r.email })
    setErrors({})
    setDialogOpen(true)
  }

  const confirmarEliminar = (r: Usuario) => {
    setEliminando(r)
    setDeleteDialogOpen(true)
  }

  const validar = () => {
    const errs: Record<string, string> = {}
    if (!form.nombre_completo.trim()) errs.nombre_completo = "El nombre es requerido"
    if (!form.email.trim()) errs.email = "El email es requerido"
    else if (!form.email.includes("@")) errs.email = "Email inválido"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const guardar = () => {
    if (!validar()) return
    if (editando) {
      setRegentes((prev) =>
        prev.map((r) =>
          r.id === editando.id
            ? { ...r, nombre_completo: form.nombre_completo, email: form.email }
            : r
        )
      )
    } else {
      const nuevo: Usuario = {
        id: `u${Date.now()}`,
        nombre_completo: form.nombre_completo,
        email: form.email,
        rol: "regente",
        avatar_url: null,
        created_at: new Date().toISOString(),
      }
      setRegentes((prev) => [...prev, nuevo])
    }
    setDialogOpen(false)
  }

  const eliminar = () => {
    if (eliminando) {
      setRegentes((prev) => prev.filter((r) => r.id !== eliminando.id))
    }
    setDeleteDialogOpen(false)
    setEliminando(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regentes</h1>
          <p className="text-gray-500 text-sm mt-1">{regentes.length} regentes registrados</p>
        </div>
        <Button onClick={abrirNuevo} className="bg-[#0f1f3d] hover:bg-[#1a3461] text-white gap-2">
          <Plus className="w-4 h-4" />
          Nuevo regente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar regente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80">
              <TableHead className="font-semibold text-gray-700">Nombre</TableHead>
              <TableHead className="font-semibold text-gray-700">Email</TableHead>
              <TableHead className="font-semibold text-gray-700">Rol</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-7 h-7 text-gray-300 shrink-0" />
                    <span className="font-medium text-gray-900">{r.nombre_completo}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 text-sm">{r.email}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Regente
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => abrirEditar(r)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[#0f1f3d] hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => confirmarEliminar(r)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar regente" : "Nuevo regente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo <span className="text-red-500">*</span></Label>
              <Input
                placeholder="Ej: María García"
                value={form.nombre_completo}
                onChange={(e) => setForm((f) => ({ ...f, nombre_completo: e.target.value }))}
              />
              {errors.nombre_completo && <p className="text-xs text-red-500">{errors.nombre_completo}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                placeholder="regente@colegiodorado.edu"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} className="bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
              {editando ? "Guardar" : "Crear regente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Eliminar regente
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Eliminar a <strong>{eliminando?.nombre_completo}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}