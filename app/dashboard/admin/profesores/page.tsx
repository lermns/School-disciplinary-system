"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchProfesores, fetchInfraccionesProfesor } from "@/lib/data"
import { getGravedadConfig, formatDate } from "@/lib/helpers"
import type { Profesor, Infraccion } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ImprimirCredencialesDialog } from "@/components/admin/imprimir-credenciales-dialog"
import { UserPlus, Trash2, BookOpen, CalendarDays, FileText, CheckCircle2, Copy, Check, AlertTriangle, Pencil, KeyRound } from "lucide-react"
import { toast } from "sonner"


function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

function CopiarBoton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => {
    navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <button onClick={copiar} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
      {copiado ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
    </button>
  )
}

// ── Modal Crear Profesor ──────────────────────────────────
function CrearProfesorModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [nombre, setNombre] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [credenciales, setCredenciales] = useState<{ codigo: string; email: string; password: string; nombre_completo: string } | null>(null)

  const canSubmit = nombre.trim() && !saving

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/crear-profesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre_completo: nombre.trim() }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) { setError(json.error ?? "Error desconocido"); setSaving(false); return }
      setCredenciales(json.credenciales)
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  const cerrar = () => {
    const huboCreacion = !!credenciales
    setNombre(""); setError(""); setCredenciales(null)
    onClose()
    if (huboCreacion) onCreated()
  }

  const copiarTodo = () => {
    if (!credenciales) return
    navigator.clipboard.writeText(`Profesor: ${credenciales.nombre_completo}\nCódigo: ${credenciales.codigo}\nContraseña: ${credenciales.password}`)
    toast.success("Credenciales copiadas")
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{credenciales ? "Profesor creado" : "Nuevo profesor"}</DialogTitle></DialogHeader>

        {credenciales ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <p className="font-semibold">{credenciales.nombre_completo}</p>
            </div>
            <div className="rounded-lg border bg-amber-50 border-amber-200 p-3 flex gap-2">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium">
                Estas credenciales solo se mostrarán <strong>una vez</strong>. Guárdalas antes de cerrar.
              </p>
            </div>
            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Código de acceso</p>
                  <p className="font-mono font-bold text-lg">{credenciales.codigo}</p>
                </div>
                <CopiarBoton texto={credenciales.codigo} />
              </div>
              <div className="border-t" />
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Contraseña</p>
                  <p className="font-mono font-bold text-lg">{credenciales.password}</p>
                </div>
                <CopiarBoton texto={credenciales.password} />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={copiarTodo} className="flex-1 gap-2"><Copy className="size-4" />Copiar todo</Button>
              <Button onClick={cerrar} className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white">Entendido</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo <span className="text-destructive">*</span></Label>
              <Input placeholder="Ej: Roberto Flores" value={nombre} onChange={e => setNombre(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            </div>
            {error && <p className="text-xs text-destructive font-medium bg-destructive/10 rounded-lg p-2">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={cerrar} className="flex-1 cursor-pointer">Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!canSubmit} className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white gap-2 cursor-pointer">
                {saving ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creando...</> : <><UserPlus className="size-4" />Crear profesor</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Dialog detalle del profesor ───────────────────────────
function ProfesorDetalleDialog({
  profesor, onClose, onDeleted, onEdited,
}: {
  profesor: Profesor | null; onClose: () => void; onDeleted: () => void; onEdited: () => void
}) {
  const [infracciones, setInfracciones] = useState<Infraccion[]>([])
  const [loadingInfs, setLoadingInfs] = useState(false)
  const [selected, setSelected] = useState<Infraccion | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [credPrint, setCredPrint] = useState<{ nombre_completo: string; curso: string; seccion: string; codigo: string; password: string } | null>(null)

  useEffect(() => {
    if (!profesor) return
    setLoadingInfs(true)
    fetchInfraccionesProfesor(profesor.id).then(infs => {
      setInfracciones(infs); setLoadingInfs(false)
    })
  }, [profesor])

  const handleDelete = async () => {
    if (!profesor) return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/eliminar-profesor", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profesorId: profesor.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) { toast.error(json.error ?? "Error al eliminar"); setDeleting(false); return }
      toast.success(`${profesor.nombre_completo} eliminado correctamente`)
      setConfirmDelete(false)
      onClose()
      onDeleted()
    } catch { toast.error("Error de conexión"); setDeleting(false) }
  }

  const handleReset = async () => {
    if (!profesor) return
    setResetting(true)
    try {
      const res = await fetch("/api/admin/resetear-profesor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profesorId: profesor.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) { toast.error(json.error ?? "Error"); setResetting(false); return }
      // Abrir dialog de impresión con las nuevas credenciales
      // Profesores no tienen curso/sección propio, usamos rol
      setCredPrint({ ...json.credenciales, curso: "Profesor", seccion: "" })
    } catch { toast.error("Error de conexión") }
    setResetting(false)
  }

  return (
    <>
      <Dialog open={!!profesor} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <DialogTitle className="text-base">Perfil del Profesor</DialogTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost" size="icon"
                  className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                  onClick={() => onEdited()}
                  title="Editar profesor"
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {profesor && (
            <div className="space-y-4 pt-1">
              {/* Perfil */}
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {getInitials(profesor.nombre_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{profesor.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">{profesor.email}</p>
                </div>
                <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">Profesor</Badge>
              </div>

              {/* Resetear contraseña */}
              <Button
                variant="outline"
                className="w-full gap-2 text-sm cursor-pointer"
                onClick={handleReset}
                disabled={resetting}
              >
                {resetting
                  ? <><span className="size-4 animate-spin rounded-full border-2 border-muted border-t-foreground" />Generando...</>
                  : <><KeyRound className="size-4" />Imprimir credenciales</>}
              </Button>
              <p className="text-xs text-muted-foreground -mt-2 text-center">
                Esto regenerará la contraseña del profesor
              </p>

              {/* Infracciones registradas */}
              <div>
                <p className="text-sm font-semibold mb-2">
                  Infracciones registradas
                  <span className="ml-2 text-xs font-normal text-muted-foreground">({infracciones.length})</span>
                </p>

                {loadingInfs ? (
                  <div className="text-xs text-muted-foreground py-4 text-center">Cargando...</div>
                ) : infracciones.length === 0 ? (
                  <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Sin infracciones registradas</div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {infracciones.map(inf => {
                      const g = inf.tipo_falta ? getGravedadConfig(inf.tipo_falta.gravedad) : null
                      return (
                        <button key={inf.id} onClick={() => setSelected(inf)}
                          className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{inf.estudiante?.nombre_completo}</p>
                              <p className="text-xs text-muted-foreground">{inf.tipo_falta?.nombre}</p>
                            </div>
                            {g && <Badge variant="outline" className={`text-xs shrink-0 ${g.className}`}>{g.label}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(inf.fecha)}</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detalle infracción */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-base">Detalle de infracción</DialogTitle></DialogHeader>
          {selected && (() => {
            const g = selected.tipo_falta ? getGravedadConfig(selected.tipo_falta.gravedad) : null
            return (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {selected.estudiante ? getInitials(selected.estudiante.nombre_completo) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{selected.estudiante?.nombre_completo}</p>
                    <p className="text-xs text-muted-foreground">{selected.estudiante?.curso} — Sección {selected.estudiante?.seccion}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Tipo de falta</p><p className="font-medium">{selected.tipo_falta?.nombre ?? "—"}</p></div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div><p className="text-xs text-muted-foreground">Fecha</p><p className="font-medium">{formatDate(selected.fecha)}</p></div>
                  </div>
                </div>
                {g && <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Gravedad:</span><Badge variant="outline" className={g.className}>{g.label}</Badge></div>}
                <div className="flex items-start gap-2">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div><p className="text-xs text-muted-foreground mb-1">Descripción</p><p className="text-sm leading-relaxed">{selected.descripcion || "Sin descripción."}</p></div>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminar */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />Eliminar profesor
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                ¿Estás seguro de que deseas eliminar a <strong>{profesor?.nombre_completo}</strong>?
                <br /><br />
                Se eliminará permanentemente su perfil, cuenta de acceso y cursos asignados.
                <br /><span className="font-semibold text-destructive">Esta acción no se puede deshacer.</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive hover:bg-destructive/90 text-white">
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Imprimir credenciales del profesor */}
      <ImprimirCredencialesDialog
        credenciales={credPrint ? [credPrint] : []}
        open={!!credPrint}
        onClose={() => setCredPrint(null)}
      />
    </>
  )
}


// ── Modal Editar Profesor ─────────────────────────────────
function EditarProfesorModal({
  profesor, onClose, onSaved,
}: {
  profesor: Profesor | null; onClose: () => void; onSaved: () => void
}) {
  const [nombre, setNombre] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (profesor) { setNombre(profesor.nombre_completo); setError("") }
  }, [profesor])

  const canSubmit = nombre.trim() && !saving

  const handleSave = async () => {
    if (!canSubmit || !profesor) return
    setSaving(true); setError("")
    try {
      const res = await fetch("/api/admin/actualizar-profesor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profesorId: profesor.id, nombre_completo: nombre.trim() }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) { setError(json.error ?? "Error desconocido"); setSaving(false); return }
      toast.success("Profesor actualizado correctamente")
      onSaved()
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  return (
    <Dialog open={!!profesor} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Editar profesor</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre completo <span className="text-destructive">*</span></Label>
            <Input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Roberto Flores"
              onKeyDown={e => e.key === "Enter" && handleSave()}
            />
          </div>
          {error && <p className="text-xs text-destructive font-medium bg-destructive/10 rounded-lg p-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1 cursor-pointer">Cancelar</Button>
            <Button onClick={handleSave} disabled={!canSubmit} className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white cursor-pointer">
              {saving ? <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Guardando...</> : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Página principal ──────────────────────────────────────
export default function AdminProfesoresPage() {
  const [profesores, setProfesores] = useState<Profesor[]>([])
  const [loading, setLoading] = useState(true)
  const [crearOpen, setCrearOpen] = useState(false)
  const [detalle, setDetalle] = useState<Profesor | null>(null)
  const [editando, setEditando] = useState<Profesor | null>(null)

  const cargarDatos = useCallback(async () => {
    setLoading(true)
    setProfesores(await fetchProfesores())
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Cargando profesores...</div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Profesores</h1>
          <p className="text-sm text-muted-foreground">{profesores.length} profesor{profesores.length !== 1 ? "es" : ""} registrado{profesores.length !== 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setCrearOpen(true)} className="gap-2 bg-[#0f1f3d] hover:bg-[#1a3461] text-white shrink-0 cursor-pointer">
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">Nuevo profesor</span>
          <span className="sm:hidden">Nuevo</span>
        </Button>
      </div>

      {profesores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <UserPlus className="size-7 opacity-40" />
          </div>
          <p className="font-medium">No hay profesores registrados aún</p>
          <Button onClick={() => setCrearOpen(true)} variant="outline" className="gap-2">
            <UserPlus className="size-4" />Crear primer profesor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {profesores.map(prof => (
            <div
              key={prof.id}
              onClick={() => setDetalle(prof)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-[#0f1f3d]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="size-10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getInitials(prof.nombre_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate text-black">{prof.nombre_completo}</p>
                  <p className="text-xs text-muted-foreground">{prof.email}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      <CrearProfesorModal open={crearOpen} onClose={() => setCrearOpen(false)} onCreated={cargarDatos} />
      <ProfesorDetalleDialog profesor={detalle} onClose={() => setDetalle(null)} onDeleted={cargarDatos} onEdited={() => { setEditando(detalle); setDetalle(null) }} />
      <EditarProfesorModal profesor={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); cargarDatos() }} />
    </div>
  )
}