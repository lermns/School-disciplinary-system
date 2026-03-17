"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchInfraccionesProfesor, fetchTiposFalta, updateInfraccion } from "@/lib/data"
import { useDebounce } from "@/lib/use-debounce"
import { getGravedadConfig, formatDate, todayISO } from "@/lib/helpers"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Pencil, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Infraccion, TipoFalta } from "@/lib/types"

function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

// ── Modal de edición (SIN CAMBIOS) ──────────────────────────
function EditarInfraccionModal({
    infraccion, tiposFalta, onClose, onSaved,
}: {
    infraccion: Infraccion | null
    tiposFalta: TipoFalta[]
    onClose: () => void
    onSaved: (updated: Infraccion) => void
}) {
    const [tipoFaltaId, setTipoFaltaId] = useState("")
    const [fecha, setFecha] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        if (infraccion) {
            setTipoFaltaId(infraccion.tipo_falta_id)
            setFecha(infraccion.fecha)
            setDescripcion(infraccion.descripcion ?? "")
            setSuccess(false)
        }
    }, [infraccion])

    const canSubmit = !!tipoFaltaId && !!fecha && !saving

    const handleSave = async () => {
        if (!infraccion || !canSubmit) return
        setSaving(true)
        const error = await updateInfraccion(infraccion.id, { tipo_falta_id: tipoFaltaId, fecha, descripcion })
        setSaving(false)
        if (error) { toast.error("Error al guardar: " + error); return }
        const tipoActualizado = tiposFalta.find(tf => tf.id === tipoFaltaId)
        const infraccionActualizada: Infraccion = {
            ...infraccion,
            tipo_falta_id: tipoFaltaId,
            fecha,
            descripcion,
            tipo_falta: tipoActualizado ?? infraccion.tipo_falta,
        }
        setSuccess(true)
        onSaved(infraccionActualizada)
    }

    const cerrar = () => { setSuccess(false); onClose() }

    return (
        <Dialog open={!!infraccion} onOpenChange={open => !open && cerrar()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base">
                        {success ? "Infracción actualizada" : "Editar infracción"}
                    </DialogTitle>
                </DialogHeader>

                {success ? (
                    <div className="py-8 flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <p className="font-semibold text-foreground">¡Cambios guardados!</p>
                        <p className="text-sm text-muted-foreground">
                            La infracción de <strong>{infraccion?.estudiante?.nombre_completo}</strong> fue actualizada.
                        </p>
                        <Button onClick={cerrar} className="mt-2 w-full bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
                            Cerrar
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {infraccion?.estudiante && (
                            <div className="flex items-center gap-3 rounded-lg bg-muted/40 border px-3 py-2.5">
                                <Avatar className="size-8 shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                        {getInitials(infraccion.estudiante.nombre_completo)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">{infraccion.estudiante.nombre_completo}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {infraccion.estudiante.curso} — Sección {infraccion.estudiante.seccion}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Fecha <span className="text-destructive">*</span></Label>
                            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} max={todayISO()} />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Tipo de falta <span className="text-destructive">*</span></Label>
                            <Select value={tipoFaltaId} onValueChange={setTipoFaltaId}>
                                <SelectTrigger className="cursor-pointer">
                                    <SelectValue placeholder="Selecciona un tipo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {tiposFalta.map(tf => {
                                        const g = getGravedadConfig(tf.gravedad)
                                        return (
                                            <SelectItem key={tf.id} value={tf.id} className="cursor-pointer">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: tf.color }} />
                                                    <span>{tf.nombre}</span>
                                                    <span className={`ml-1 text-xs ${g.className} px-1.5 py-0.5 rounded border`}>{g.label}</span>
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Descripción <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
                            <Textarea placeholder="Observaciones adicionales..." value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3} />
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" onClick={cerrar} className="flex-1 cursor-pointer">Cancelar</Button>
                            <Button onClick={handleSave} disabled={!canSubmit} className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white cursor-pointer">
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ── Página principal ───────────────────────────────────────
export default function ProfesorHistorialPage() {
    const { user } = useAuth()
    const [infracciones, setInfracciones] = useState<Infraccion[]>([])
    const [tiposFalta, setTiposFalta] = useState<TipoFalta[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filterGravedad, setFilterGravedad] = useState("all")
    const [editando, setEditando] = useState<Infraccion | null>(null)

    // ✨ NUEVO: Debounce del search
    const debouncedSearch = useDebounce(search, 400)

    // ✨ NUEVO: Detectar si hay filtros activos
    const hasActiveFilters = useMemo(() => {
        return debouncedSearch.trim() !== "" || filterGravedad !== "all"
    }, [debouncedSearch, filterGravedad])

    const cargarDatos = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)

        // ✨ ESTRATEGIA INTELIGENTE:
        // - Sin filtros → Solo últimas 100 infracciones del profesor
        // - Con filtros → Cargar más para filtrar mejor (500 máx)
        const limit = hasActiveFilters ? 500 : 100

        const [infs, tipos] = await Promise.all([
            fetchInfraccionesProfesor(user.id, limit),
            fetchTiposFalta(),
        ])

        setInfracciones(infs)
        setTiposFalta(tipos)
        setLoading(false)
    }, [user?.id, hasActiveFilters])

    // ✨ NUEVO: Recargar cuando cambian los filtros
    useEffect(() => {
        cargarDatos()
    }, [cargarDatos])

    // ✨ OPTIMIZADO: Usar debouncedSearch
    const filtered = useMemo(() => infracciones.filter(inf => {
        const matchSearch = !debouncedSearch
            || inf.estudiante?.nombre_completo.toLowerCase().includes(debouncedSearch.toLowerCase())
            || inf.tipo_falta?.nombre.toLowerCase().includes(debouncedSearch.toLowerCase())
            || inf.descripcion.toLowerCase().includes(debouncedSearch.toLowerCase())
        return matchSearch && (filterGravedad === "all" || inf.tipo_falta?.gravedad === filterGravedad)
    }), [infracciones, debouncedSearch, filterGravedad])

    const handleSaved = (updated: Infraccion) => {
        setInfracciones(prev => prev.map(i => i.id === updated.id ? updated : i))
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Cargando historial...
        </div>
    )

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-serif text-2xl font-bold text-foreground">Mi Historial</h1>
                {/* ✨ NUEVO: Indicador inteligente */}
                <p className="text-sm text-muted-foreground">
                    {hasActiveFilters
                        ? `${filtered.length} de ${infracciones.length} infracciones encontradas`
                        : `${infracciones.length} infracciones registradas por ti`
                    }
                </p>
            </div>

            <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                    {/* ✨ Input con spinner de debounce */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por estudiante, tipo o descripción..."
                            className="pl-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {/* ✨ Spinner mientras debounce */}
                        {search !== debouncedSearch && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="size-4 animate-spin rounded-full border-2 border-muted border-t-primary" />
                            </div>
                        )}
                    </div>
                    <Select value={filterGravedad} onValueChange={setFilterGravedad}>
                        <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Gravedad" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las gravedades</SelectItem>
                            <SelectItem value="leve">Leve</SelectItem>
                            <SelectItem value="grave">Grave</SelectItem>
                            <SelectItem value="muy_grave">Muy Grave</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                        {filtered.length} registro{filtered.length !== 1 ? "s" : ""}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Estudiante</TableHead>
                                    <TableHead>Tipo de Falta</TableHead>
                                    <TableHead>Gravedad</TableHead>
                                    <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                                    <TableHead className="hidden xl:table-cell">Descripción</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                                            {infracciones.length === 0
                                                ? "No has registrado infracciones aún."
                                                : "No se encontraron registros con los filtros seleccionados."}
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.map(inf => {
                                    const g = inf.tipo_falta ? getGravedadConfig(inf.tipo_falta.gravedad) : null
                                    return (
                                        <TableRow key={inf.id} className="group">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="size-7">
                                                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                                                            {inf.estudiante ? getInitials(inf.estudiante.nombre_completo) : "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{inf.estudiante?.nombre_completo}</p>
                                                        <p className="text-xs text-muted-foreground">{inf.estudiante?.curso} {inf.estudiante?.seccion}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">{inf.tipo_falta?.nombre}</TableCell>
                                            <TableCell>{g && <Badge variant="outline" className={g.className}>{g.label}</Badge>}</TableCell>
                                            <TableCell className="hidden text-sm text-muted-foreground lg:table-cell whitespace-nowrap">{formatDate(inf.fecha)}</TableCell>
                                            <TableCell className="hidden max-w-[250px] truncate text-sm text-muted-foreground xl:table-cell">{inf.descripcion}</TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => setEditando(inf)}
                                                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                                    title="Editar"
                                                >
                                                    <Pencil className="size-3.5" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <EditarInfraccionModal
                infraccion={editando}
                tiposFalta={tiposFalta}
                onClose={() => setEditando(null)}
                onSaved={inf => { handleSaved(inf); setEditando(null) }}
            />
        </div>
    )
}