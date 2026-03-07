"use client"

import { useState } from "react"
import { mockTiposFalta, tiposFaltaRegente } from "@/lib/mock-data"
import type { TipoFalta, Gravedad } from "@/lib/types"
import { getGravedadConfig } from "@/lib/helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, AlertTriangle, Info } from "lucide-react"

const COLORS_POR_GRAVEDAD: Record<Gravedad, string> = {
  leve: "#22c55e",
  grave: "#eab308",
  muy_grave: "#ef4444",
}

const emptyForm = { nombre: "", descripcion: "", gravedad: "leve" as Gravedad, asignadoRegente: false }

export default function AdminTiposFaltaPage() {
  const [tipos, setTipos] = useState<TipoFalta[]>(mockTiposFalta)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editando, setEditando] = useState<TipoFalta | null>(null)
  const [eliminando, setEliminando] = useState<TipoFalta | null>(null)
  const [form, setForm] = useState(emptyForm)

  const abrirNuevo = () => {
    setEditando(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const abrirEditar = (tipo: TipoFalta) => {
    setEditando(tipo)
    setForm({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      gravedad: tipo.gravedad,
      asignadoRegente: tipo.asignadoRegente ?? false,
    })
    setDialogOpen(true)
  }

  const confirmarEliminar = (tipo: TipoFalta) => {
    setEliminando(tipo)
    setDeleteDialogOpen(true)
  }

  const guardar = () => {
    if (!form.nombre.trim()) return
    const asignadoRegente = form.gravedad === "leve" ? form.asignadoRegente : false
    if (editando) {
      setTipos(prev =>
        prev.map(t =>
          t.id === editando.id
            ? { ...t, nombre: form.nombre, descripcion: form.descripcion, gravedad: form.gravedad, color: COLORS_POR_GRAVEDAD[form.gravedad], asignadoRegente }
            : t
        )
      )
      // Actualizar también en mockTiposFalta para que getTiposFaltaRegente() lo refleje
      const idx = mockTiposFalta.findIndex(t => t.id === editando.id)
      if (idx !== -1) {
        mockTiposFalta[idx] = { ...mockTiposFalta[idx], nombre: form.nombre, descripcion: form.descripcion, gravedad: form.gravedad, color: COLORS_POR_GRAVEDAD[form.gravedad], asignadoRegente }
      }
    } else {
      const nuevo: TipoFalta = {
        id: `tf${Date.now()}`,
        nombre: form.nombre,
        descripcion: form.descripcion,
        gravedad: form.gravedad,
        color: COLORS_POR_GRAVEDAD[form.gravedad],
        asignadoRegente,
      }
      setTipos(prev => [...prev, nuevo])
      mockTiposFalta.push(nuevo)
    }
    setDialogOpen(false)
  }

  const eliminar = () => {
    if (eliminando) {
      setTipos(prev => prev.filter(t => t.id !== eliminando.id))
      const idx = mockTiposFalta.findIndex(t => t.id === eliminando.id)
      if (idx !== -1) mockTiposFalta.splice(idx, 1)
    }
    setDeleteDialogOpen(false)
    setEliminando(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Tipos de Falta</h1>
          <p className="text-muted-foreground text-sm mt-1">{tipos.length} tipos registrados</p>
        </div>
        <Button onClick={abrirNuevo} className="bg-[#0f1f3d] hover:bg-[#1a3461] text-white gap-2">
          <Plus className="w-4 h-4" />
          Nuevo tipo
        </Button>
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <p>Los tipos marcados con <span className="font-semibold">★ Regente</span> son los que pueden ser registrados por el regente (solo faltas leves).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tipos.map(tipo => {
          const gravedadCfg = getGravedadConfig(tipo.gravedad)
          return (
            <div key={tipo.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tipo.color }} />
                  <p className="font-semibold text-gray-900 truncate">{tipo.nombre}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => abrirEditar(tipo)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#0f1f3d] hover:bg-gray-100 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirmarEliminar(tipo)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{tipo.descripcion}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`text-xs ${gravedadCfg.className}`}>{gravedadCfg.label}</Badge>
                {tipo.asignadoRegente && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">★ Regente</Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar tipo de falta" : "Nuevo tipo de falta"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                placeholder="Ej: Uso de celular"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Gravedad</Label>
              <Select
                value={form.gravedad}
                onValueChange={v => setForm(f => ({ ...f, gravedad: v as Gravedad, asignadoRegente: v !== "leve" ? false : f.asignadoRegente }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                  <SelectItem value="muy_grave">Muy Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checkbox asignar a regente — solo visible si gravedad es leve */}
            {form.gravedad === "leve" && (
              <div className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
                <Checkbox
                  id="asignadoRegente"
                  checked={form.asignadoRegente}
                  onCheckedChange={v => setForm(f => ({ ...f, asignadoRegente: !!v }))}
                />
                <Label htmlFor="asignadoRegente" className="text-sm text-blue-700 cursor-pointer font-normal">
                  Permitir al regente registrar esta falta
                </Label>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción de la falta..."
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardar} disabled={!form.nombre.trim()} className="bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
              {editando ? "Guardar cambios" : "Crear tipo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Eliminar tipo de falta
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>{eliminando?.nombre}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={eliminar} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}