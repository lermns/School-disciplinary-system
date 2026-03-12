"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, Copy, Check, UserPlus, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const CURSOS = ["1ro", "2do", "3ro", "4to", "5to", "6to"]
const SECCIONES = ["A", "B", "C"]

interface Credenciales {
    codigo: string
    email: string
    password: string
    nombre_completo: string
    curso: string
    seccion: string
}

interface Props {
    open: boolean
    onClose: () => void
    onCreated: () => void
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

export function CrearEstudianteModal({ open, onClose, onCreated }: Props) {
    const [form, setForm] = useState({ nombre_completo: "", curso: "", seccion: "", direccion: "" })
    const [saving, setSaving] = useState(false)
    const [credenciales, setCredenciales] = useState<Credenciales | null>(null)
    const [error, setError] = useState("")

    const canSubmit = form.nombre_completo.trim() && form.curso && form.seccion && form.direccion.trim()

    const handleSubmit = async () => {
        if (!canSubmit) return
        setSaving(true)
        setError("")

        try {
            const res = await fetch("/api/admin/crear-estudiante", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            const json = await res.json()

            if (!res.ok || !json.ok) {
                setError(json.error ?? "Error desconocido")
                setSaving(false)
                return
            }

            setCredenciales(json.credenciales)
            onCreated()
        } catch (e: any) {
            setError(e.message)
        }

        setSaving(false)
    }

    const cerrar = () => {
        setForm({ nombre_completo: "", curso: "", seccion: "", direccion: "" })
        setCredenciales(null)
        setError("")
        onClose()
    }

    const copiarTodo = () => {
        if (!credenciales) return
        const texto = `Estudiante: ${credenciales.nombre_completo}\nCódigo: ${credenciales.codigo}\nContraseña: ${credenciales.password}`
        navigator.clipboard.writeText(texto)
        toast.success("Credenciales copiadas")
    }

    return (
        <Dialog open={open} onOpenChange={cerrar}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{credenciales ? "Estudiante creado" : "Nuevo estudiante"}</DialogTitle>
                </DialogHeader>

                {credenciales ? (
                    // ── Pantalla de credenciales ──────────────────────────
                    <div className="space-y-4 py-2">
                        <div className="flex flex-col items-center gap-2 py-2">
                            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-9 h-9 text-green-500" />
                            </div>
                            <p className="font-semibold text-foreground">{credenciales.nombre_completo}</p>
                            <p className="text-sm text-muted-foreground">{credenciales.curso} — Sección {credenciales.seccion}</p>
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
                                    <p className="font-mono font-bold text-lg text-foreground">{credenciales.codigo}</p>
                                </div>
                                <CopiarBoton texto={credenciales.codigo} />
                            </div>
                            <div className="border-t" />
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">Contraseña</p>
                                    <p className="font-mono font-bold text-lg text-foreground">{credenciales.password}</p>
                                </div>
                                <CopiarBoton texto={credenciales.password} />
                            </div>
                            <div className="border-t" />
                            <div>
                                <p className="text-xs text-muted-foreground">Email de acceso (sistema)</p>
                                <p className="font-mono text-xs text-muted-foreground">{credenciales.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={copiarTodo} className="flex-1 gap-2">
                                <Copy className="size-4" /> Copiar todo
                            </Button>
                            <Button onClick={cerrar} className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
                                Entendido
                            </Button>
                        </div>
                    </div>
                ) : (
                    // ── Formulario ────────────────────────────────────────
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Nombre completo <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder="Ej: Alejandro Rodríguez"
                                value={form.nombre_completo}
                                onChange={e => setForm(f => ({ ...f, nombre_completo: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Curso <span className="text-destructive">*</span></Label>
                                <Select value={form.curso} onValueChange={v => setForm(f => ({ ...f, curso: v }))}>
                                    <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent>
                                        {CURSOS.map(c => <SelectItem key={c} value={c} className="cursor-pointer">
                                            {c}
                                        </SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sección <span className="text-destructive">*</span></Label>
                                <Select value={form.seccion} onValueChange={v => setForm(f => ({ ...f, seccion: v }))}>
                                    <SelectTrigger className="cursor-pointer"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent>
                                        {SECCIONES.map(s => <SelectItem key={s} value={s} className="cursor-pointer">Sección {s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Dirección <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder="Ej: Calle 45 #12-34, Bogotá"
                                value={form.direccion}
                                onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-destructive font-medium bg-destructive/10 rounded-lg p-2">{error}</p>
                        )}

                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" onClick={cerrar} className="flex-1 cursor-pointer">Cancelar</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!canSubmit || saving}
                                className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white gap-2 cursor-pointer"
                            >
                                {saving ? (
                                    <><span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Creando...</>
                                ) : (
                                    <><UserPlus className="size-4" />Crear estudiante</>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}