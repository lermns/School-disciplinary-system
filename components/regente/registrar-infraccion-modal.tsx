"use client"

import { useState } from "react"
import type { Estudiante } from "@/lib/types"
import { getTiposFaltaRegente, getRetrasoCount, mockInfracciones } from "@/lib/mock-data"
import { todayISO } from "@/lib/helpers"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CalendarDays, CheckCircle2 } from "lucide-react"
import { formatDate } from "@/lib/helpers"

interface Props {
    open: boolean
    onClose: () => void
    estudiante: Estudiante
    regenteId: string
}

export function RegistrarInfraccionModal({ open, onClose, estudiante, regenteId }: Props) {
    const [tipoFaltaId, setTipoFaltaId] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [success, setSuccess] = useState(false)
    const [retrasos, setRetrasos] = useState(() => getRetrasoCount(estudiante.id))

    const hoy = todayISO()
    // Llamada en tiempo real para reflejar cambios en tipos-falta
    const tiposDisponibles = getTiposFaltaRegente()

    const registradosHoy = mockInfracciones
        .filter(i => i.estudiante_id === estudiante.id && i.fecha === hoy)
        .map(i => i.tipo_falta_id)

    const yaRegistradoHoy = tipoFaltaId ? registradosHoy.includes(tipoFaltaId) : false

    const handleSubmit = () => {
        if (!tipoFaltaId || yaRegistradoHoy) return
        const nueva = {
            id: `i${Date.now()}`,
            estudiante_id: estudiante.id,
            regente_id: regenteId,
            tipo_falta_id: tipoFaltaId,
            fecha: hoy,
            descripcion,
            created_at: new Date().toISOString(),
        }
        mockInfracciones.push(nueva)
        if (tipoFaltaId === "tf1") setRetrasos(r => r + 1)
        setSuccess(true)
    }

    const cerrar = () => {
        setTipoFaltaId("")
        setDescripcion("")
        setSuccess(false)
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={cerrar}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar infracción leve</DialogTitle>
                </DialogHeader>

                {success ? (
                    <div className="py-8 flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="font-semibold text-gray-900">¡Infracción registrada!</p>
                        <p className="text-sm text-gray-500">
                            La falta de <strong>{estudiante.nombre_completo}</strong> ha sido guardada correctamente.
                        </p>
                        <Button onClick={cerrar} className="mt-2 bg-[#0f1f3d] hover:bg-[#1a3461] text-white w-full">
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-5 py-2">
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{estudiante.nombre_completo}</p>
                                    <p className="text-xs text-gray-500">{estudiante.curso} — Sección {estudiante.seccion}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${retrasos > 0 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-100 text-gray-500"}`}>
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{retrasos} retraso{retrasos !== 1 ? "s" : ""}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <CalendarDays className="w-3.5 h-3.5" />
                                <span>Fecha registrada automáticamente: <strong>{formatDate(hoy)}</strong></span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Tipo de falta <span className="text-red-500">*</span></Label>
                            <Select value={tipoFaltaId} onValueChange={setTipoFaltaId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una falta..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposDisponibles.map(tf => {
                                        const bloqueado = registradosHoy.includes(tf.id)
                                        return (
                                            <SelectItem key={tf.id} value={tf.id} disabled={bloqueado}>
                                                <span className={bloqueado ? "text-muted-foreground line-through" : ""}>{tf.nombre}</span>
                                                {bloqueado && <span className="ml-2 text-xs text-muted-foreground">(ya registrado hoy)</span>}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            {yaRegistradoHoy ? (
                                <p className="text-xs text-destructive font-medium">Este tipo de falta ya fue registrado hoy para este estudiante.</p>
                            ) : (
                                <p className="text-xs text-gray-400">Solo se pueden registrar infracciones leves</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Descripción <span className="text-gray-400 font-normal text-xs">(opcional)</span></Label>
                            <Textarea
                                placeholder="Observaciones adicionales..."
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={cerrar} className="flex-1">Cancelar</Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!tipoFaltaId || yaRegistradoHoy}
                                className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white"
                            >
                                Registrar
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}