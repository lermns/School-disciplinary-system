"use client"

import { useState, useRef, useCallback } from "react"
import * as XLSX from "xlsx"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    Upload, FileSpreadsheet, AlertTriangle, CheckCircle2,
    XCircle, Loader2, Printer,
} from "lucide-react"
import { toast } from "sonner"

interface FilaExcel {
    nombre_completo: string
    curso: string
    seccion: string
}

interface Resultado extends FilaExcel {
    codigo: string
    email: string
    password: string
    ok: boolean
    error?: string
}

type Paso = "upload" | "preview" | "loading" | "done"

interface Props {
    open: boolean
    onClose: () => void
    onImported: () => void
    onPrintCredenciales: (resultados: Resultado[]) => void
}

// ── Convierte nombre de hoja ("1A", "3B") → { curso, seccion } ──
const CURSO_MAP: Record<string, string> = {
    "1": "1ro", "2": "2do", "3": "3ro",
    "4": "4to", "5": "5to", "6": "6to",
}

function parsearNombreHoja(hoja: string): { curso: string; seccion: string } | null {
    const m = hoja.trim().match(/^([1-6])([ABC])$/i)
    if (!m) return null
    return { curso: CURSO_MAP[m[1]], seccion: m[2].toUpperCase() }
}

// ── Parsear el workbook completo con el formato del colegio ──
// Cada hoja = un curso+sección, datos desde fila 6, col A=nº, col B=nombre
function parsearWorkbook(wb: XLSX.WorkBook): FilaExcel[] {
    const filas: FilaExcel[] = []

    for (const nombreHoja of wb.SheetNames) {
        const info = parsearNombreHoja(nombreHoja)
        if (!info) continue // hoja sin formato reconocido, se omite

        const ws = wb.Sheets[nombreHoja]
        const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })

        // Los datos empiezan en la fila 6 (índice 5)
        for (let i = 5; i < rows.length; i++) {
            const row = rows[i]
            const num = row?.[0]   // columna A: número de lista
            const nombre = row?.[1]   // columna B: apellidos y nombres

            // Fin de la lista cuando el número es null/undefined
            if (num === null || num === undefined) break

            const nombreLimpio = String(nombre ?? "").trim().replace(/^\.+/, "").trim()
            if (!nombreLimpio) continue

            filas.push({
                nombre_completo: nombreLimpio,
                curso: info.curso,
                seccion: info.seccion,
            })
        }
    }

    return filas
}

export function ImportarEstudiantesModal({ open, onClose, onImported, onPrintCredenciales }: Props) {
    const [paso, setPaso] = useState<Paso>("upload")
    const [filas, setFilas] = useState<FilaExcel[]>([])
    const [resultados, setResultados] = useState<Resultado[]>([])
    const [progreso, setProgreso] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [filterHoja, setFilterHoja] = useState("all")
    const fileRef = useRef<HTMLInputElement>(null)

    const parsearArchivo = useCallback((file: File) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer)
                const wb = XLSX.read(data, { type: "array" })

                // Verificar que al menos una hoja tenga el formato del colegio
                const hojasReconocidas = wb.SheetNames.filter(h => parsearNombreHoja(h))
                if (hojasReconocidas.length === 0) {
                    toast.error("No se encontraron hojas con el formato esperado (ej: 1A, 2B, 3C...)")
                    return
                }

                const filasParsed = parsearWorkbook(wb)
                if (filasParsed.length === 0) {
                    toast.error("No se encontraron estudiantes en el archivo")
                    return
                }

                setFilas(filasParsed)
                setPaso("preview")
            } catch {
                toast.error("No se pudo leer el archivo. Asegúrate de que es un .xlsx válido.")
            }
        }
        reader.readAsArrayBuffer(file)
    }, [])

    const handleFile = (file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase()
        if (!["xlsx", "xls"].includes(ext ?? "")) {
            toast.error("Solo se aceptan archivos .xlsx o .xls")
            return
        }
        parsearArchivo(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    // Cursos únicos para el filtro de preview
    const hojasFiltro = Array.from(
        new Set(filas.map(f => `${f.curso} ${f.seccion}`))
    ).sort()

    const filasFiltradas = filterHoja === "all"
        ? filas
        : filas.filter(f => `${f.curso} ${f.seccion}` === filterHoja)

    const handleImportar = async () => {
        setPaso("loading"); setProgreso(0)
        try {
            const BATCH = 10
            const allResultados: Resultado[] = []

            for (let i = 0; i < filas.length; i += BATCH) {
                const lote = filas.slice(i, i + BATCH)
                const res = await fetch("/api/admin/importar-estudiantes", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ estudiantes: lote }),
                })
                const json = await res.json()
                if (!res.ok) throw new Error(json.error ?? "Error en la importación")
                allResultados.push(...json.resultados)
                setProgreso(Math.round(((i + lote.length) / filas.length) * 100))
            }

            setResultados(allResultados)
            setPaso("done")
            onImported()
        } catch (e: any) {
            toast.error(e.message); setPaso("preview")
        }
    }

    const cerrar = () => {
        setPaso("upload"); setFilas([]); setResultados([])
        setProgreso(0); setFilterHoja("all")
        onClose()
    }

    const exitosos = resultados.filter(r => r.ok)
    const fallidos = resultados.filter(r => !r.ok)

    return (
        <Dialog open={open} onOpenChange={cerrar}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {paso === "upload" && "Importar estudiantes desde Excel"}
                        {paso === "preview" && `Vista previa — ${filas.length} estudiantes en ${hojasFiltro.length} cursos`}
                        {paso === "loading" && "Importando..."}
                        {paso === "done" && "Importación completada"}
                    </DialogTitle>
                </DialogHeader>

                {/* ── PASO 1: Upload ── */}
                {paso === "upload" && (
                    <div className="space-y-4 py-2">
                        <p className="text-sm text-muted-foreground">
                            Sube el archivo Excel del colegio. El sistema detecta automáticamente los cursos y secciones desde el nombre de cada hoja (ej: <span className="font-medium text-foreground">1A, 2B, 3C...</span>)
                        </p>

                        <div
                            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current?.click()}
                            className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
                                }`}
                        >
                            <FileSpreadsheet className="mx-auto size-10 text-muted-foreground mb-3" />
                            <p className="font-medium text-sm">Arrastra tu archivo aquí</p>
                            <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionarlo</p>
                            <p className="text-xs text-muted-foreground mt-2">.xlsx, .xls</p>
                            <input
                                ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                            />
                        </div>

                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                            <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
                            <span>Compatible con el formato oficial del colegio: una hoja por curso-sección, datos desde la fila 6.</span>
                        </div>
                    </div>
                )}

                {/* ── PASO 2: Preview ── */}
                {paso === "preview" && (
                    <div className="space-y-4 py-2">
                        {/* Resumen por curso */}
                        <div className="flex flex-wrap gap-1.5">
                            {hojasFiltro.map(h => {
                                const count = filas.filter(f => `${f.curso} ${f.seccion}` === h).length
                                return (
                                    <button
                                        key={h}
                                        onClick={() => setFilterHoja(filterHoja === h ? "all" : h)}
                                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${filterHoja === h
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-muted/50 text-muted-foreground border-border hover:border-primary/40"
                                            }`}
                                    >
                                        {h} <span className="opacity-70">({count})</span>
                                    </button>
                                )
                            })}
                            {filterHoja !== "all" && (
                                <button onClick={() => setFilterHoja("all")} className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-primary/40 cursor-pointer">
                                    Ver todos
                                </button>
                            )}
                        </div>

                        <div className="rounded-lg border overflow-hidden">
                            <div className="max-h-64 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-8">#</TableHead>
                                            <TableHead>Apellidos y Nombres</TableHead>
                                            <TableHead>Curso</TableHead>
                                            <TableHead>Sección</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filasFiltradas.map((fila, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                                                <TableCell className="text-sm font-medium">{fila.nombre_completo}</TableCell>
                                                <TableCell className="text-sm">{fila.curso}</TableCell>
                                                <TableCell className="text-sm">{fila.seccion}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => { setPaso("upload"); setFilas([]) }} className="flex-1">
                                Cambiar archivo
                            </Button>
                            <Button onClick={handleImportar} className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white">
                                Importar {filas.length} estudiantes
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── PASO 3: Loading ── */}
                {paso === "loading" && (
                    <div className="py-12 flex flex-col items-center gap-4">
                        <Loader2 className="size-10 animate-spin text-primary" />
                        <p className="font-medium text-sm">Creando estudiantes... {progreso}%</p>
                        <div className="w-full max-w-xs bg-muted rounded-full h-2 overflow-hidden">
                            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">No cierres esta ventana</p>
                    </div>
                )}

                {/* ── PASO 4: Done ── */}
                {paso === "done" && (
                    <div className="space-y-4 py-2">
                        <div className="flex flex-col items-center gap-2 py-2">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${fallidos.length === 0 ? "bg-green-50" : "bg-amber-50"}`}>
                                {fallidos.length === 0
                                    ? <CheckCircle2 className="w-9 h-9 text-green-500" />
                                    : <AlertTriangle className="w-9 h-9 text-amber-500" />}
                            </div>
                            <p className="font-semibold text-foreground">
                                {exitosos.length} de {resultados.length} estudiantes importados
                            </p>
                            {fallidos.length > 0 && (
                                <p className="text-sm text-muted-foreground">{fallidos.length} fallaron</p>
                            )}
                        </div>

                        <div className="rounded-lg border overflow-hidden">
                            <div className="max-h-52 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Curso</TableHead>
                                            <TableHead>Código</TableHead>
                                            <TableHead className="w-8"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {resultados.map((r, i) => (
                                            <TableRow key={i} className={r.ok ? "" : "bg-destructive/5"}>
                                                <TableCell className="text-sm font-medium">{r.nombre_completo}</TableCell>
                                                <TableCell className="text-sm">{r.curso} {r.seccion}</TableCell>
                                                <TableCell className="text-sm font-mono">{r.ok ? r.codigo : "—"}</TableCell>
                                                <TableCell>
                                                    {r.ok
                                                        ? <CheckCircle2 className="size-4 text-green-500" />
                                                        : <span title={r.error}><XCircle className="size-4 text-destructive" /></span>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" onClick={cerrar} className="flex-1">Cerrar</Button>
                            {exitosos.length > 0 && (
                                <Button
                                    onClick={() => { cerrar(); onPrintCredenciales(exitosos) }}
                                    className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white gap-2"
                                >
                                    <Printer className="size-4" />
                                    Imprimir credenciales
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}