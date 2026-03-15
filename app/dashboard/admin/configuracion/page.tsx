"use client"

import { useState, useMemo, useEffect } from "react"
import { fetchEstudiantes, fetchInfracciones } from "@/lib/data"
import { formatDate } from "@/lib/helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  AlertTriangle, Download, Trash2, CheckCircle2, Loader2, Lock,
} from "lucide-react"
import { toast } from "sonner"
import type { Estudiante, Infraccion } from "@/lib/types"

// ── Mapeo número → texto ──────────────────────────────────
const CURSO_ORDER: Record<string, number> = {
  "1ro": 1, "2do": 2, "3ro": 3, "4to": 4, "5to": 5, "6to": 6,
}

function sortCursoSeccion(a: string, b: string) {
  const [ca, sa] = a.split(" ")
  const [cb, sb] = b.split(" ")
  return (CURSO_ORDER[ca] - CURSO_ORDER[cb]) || sa.localeCompare(sb)
}

// ── Genera e imprime el PDF de un curso-sección ───────────
function generarHTMLCurso(
  cursoSeccion: string,
  estudiantes: Estudiante[],
  infracciones: Infraccion[],
  esUltimo: boolean = false,
): string {
  const anio = new Date().getFullYear()
  const [curso, seccion] = cursoSeccion.split(" ")

  const estudiantesCurso = estudiantes
    .filter(e => e.curso === curso && e.seccion === seccion)
    .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo))

  const rows = estudiantesCurso.map(est => {
    const infs = infracciones.filter(i => i.estudiante_id === est.id)
    return { est, infs }
  })

  const totalInfs = rows.reduce((acc, r) => acc + r.infs.length, 0)

  return `
  <div class="curso-section${esUltimo ? "" : " page-break"}">
    <h2>${cursoSeccion}</h2>
    <p class="subtitle">
      ${estudiantesCurso.length} estudiantes · ${totalInfs} infracciones ·
      Generado: ${new Date().toLocaleDateString("es-BO")}
    </p>
    <div class="stats">
      <div class="stat"><strong>${estudiantesCurso.length}</strong><span>Estudiantes</span></div>
      <div class="stat"><strong>${totalInfs}</strong><span>Infracciones</span></div>
      <div class="stat"><strong>${rows.filter(r => r.infs.length === 0).length}</strong><span>Sin infracciones</span></div>
    </div>
    ${rows.map(({ est, infs }) => `
      <div class="student-block">
        <div class="student-header">
          <span class="student-name">${est.nombre_completo}</span>
          <span class="student-meta">${infs.length} infracción${infs.length !== 1 ? "es" : ""}</span>
        </div>
        ${infs.length === 0
      ? `<div class="no-infs">Sin infracciones registradas ✓</div>`
      : `<table>
              <thead><tr>
                <th>Tipo de Falta</th><th>Gravedad</th><th>Fecha</th>
                <th>Descripción</th><th>Registrado por</th>
              </tr></thead>
              <tbody>
                ${infs.map(inf => `
                  <tr>
                    <td>${inf.tipo_falta?.nombre ?? "—"}</td>
                    <td><span class="badge ${inf.tipo_falta?.gravedad ?? ""}">${inf.tipo_falta?.gravedad === "leve" ? "Leve" :
          inf.tipo_falta?.gravedad === "grave" ? "Grave" : "Muy Grave"
        }</span></td>
                    <td style="white-space:nowrap">${formatDate(inf.fecha)}</td>
                    <td>${inf.descripcion || "—"}</td>
                    <td>${inf.regente?.rol === "admin" ? "Admin" : inf.regente?.rol === "profesor" ? `Prof. ${inf.regente.nombre_completo.split(" ")[0]}` : "Regente"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`
    }
      </div>
    `).join("")}
  </div>`
}

// Imprime UN solo curso en ventana separada
function imprimirPDFCurso(
  cursoSeccion: string,
  estudiantes: Estudiante[],
  infracciones: Infraccion[],
): boolean {
  const anio = new Date().getFullYear()
  const body = generarHTMLCurso(cursoSeccion, estudiantes, infracciones, true)
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
  <title>Historial ${cursoSeccion} — ${anio}</title>
  <style>${CSS_ESTILOS}</style></head>
  <body>
    <h1>Módulo Educativo El Dorado — Historial Disciplinario ${anio}</h1>
    ${body}
  </body></html>`

  const win = window.open("", "_blank", "width=900,height=700")
  if (!win) { toast.error("Permite ventanas emergentes para generar el PDF"); return false }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
  return true
}

// Imprime TODOS los cursos en UNA sola ventana (evita bloqueo de popups)
function imprimirTodosPDFs(
  grupos: Array<{ key: string }>,
  estudiantes: Estudiante[],
  infracciones: Infraccion[],
): boolean {
  const anio = new Date().getFullYear()
  const body = grupos.map((g, i) =>
    generarHTMLCurso(g.key, estudiantes, infracciones, i === grupos.length - 1)
  ).join("")

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>
  <title>Historial Completo — ${anio}</title>
  <style>${CSS_ESTILOS}</style></head>
  <body>
    <h1>Módulo Educativo El Dorado — Historial Disciplinario ${anio}</h1>
    <p style="text-align:center;color:#666;font-size:10px;margin-bottom:20px">
      Historial completo · ${grupos.length} cursos · Generado: ${new Date().toLocaleDateString("es-BO")}
    </p>
    ${body}
  </body></html>`

  const win = window.open("", "_blank", "width=900,height=700")
  if (!win) { toast.error("Permite ventanas emergentes para generar el PDF"); return false }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 600)
  return true
}

const CSS_ESTILOS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; padding: 20px; }
  h1 { font-size: 15px; color: #0f1f3d; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 13px; color: #0f1f3d; margin-bottom: 2px; }
  .subtitle { text-align: center; color: #666; font-size: 10px; margin-bottom: 12px; }
  .curso-section { margin-bottom: 20px; }
  .page-break { page-break-after: always; }
  .stats { display: flex; gap: 24px; justify-content: center; margin-bottom: 16px; }
  .stat { text-align: center; }
  .stat strong { font-size: 18px; color: #0f1f3d; display: block; }
  .stat span { font-size: 9px; color: #888; text-transform: uppercase; }
  .student-block { margin-bottom: 14px; page-break-inside: avoid; }
  .student-header {
    display: flex; align-items: center; justify-content: space-between;
    background: #f3f4f6; border: 1px solid #e5e7eb;
    padding: 5px 10px; border-radius: 6px 6px 0 0;
  }
  .student-name { font-weight: bold; font-size: 12px; }
  .student-meta { font-size: 9px; color: #666; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #0f1f3d; color: #fff; padding: 4px 8px; text-align: left; font-size: 10px; }
  td { padding: 4px 8px; border-bottom: 1px solid #f0f0f0; font-size: 10px; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .no-infs { padding: 6px 10px; color: #999; font-size: 10px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 6px 6px; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; }
  .leve { background: #dcfce7; color: #166534; }
  .grave { background: #fef9c3; color: #854d0e; }
  .muy_grave { background: #fee2e2; color: #991b1b; }
  @media print { body { padding: 8px; } @page { margin: 1cm; size: A4; } }
`


// ── Sección Cierre de Año ─────────────────────────────────
function CierreAnioSection() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [infracciones, setInfracciones] = useState<Infraccion[]>([])
  const [loading, setLoading] = useState(true)
  const [descargados, setDescargados] = useState<Set<string>>(new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    Promise.all([fetchEstudiantes(), fetchInfracciones()]).then(([ests, infs]) => {
      setEstudiantes(ests.filter(e => e.activo))
      setInfracciones(infs)
      setLoading(false)
    })
  }, [])

  // Grupos curso-sección ordenados
  const grupos = useMemo(() => {
    const map = new Map<string, number>()
    estudiantes.forEach(e => {
      const key = `${e.curso} ${e.seccion}`
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => sortCursoSeccion(a.key, b.key))
  }, [estudiantes])

  const todosDescargados = grupos.length > 0 && grupos.every(g => descargados.has(g.key))

  const handleDescargar = (key: string) => {
    const ok = imprimirPDFCurso(key, estudiantes, infracciones)
    if (ok) setDescargados(prev => new Set([...prev, key]))
  }

  const handleDescargarTodos = () => {
    // Un solo window.open con todos los cursos concatenados — evita bloqueo de popups
    const ok = imprimirTodosPDFs(grupos, estudiantes, infracciones)
    if (ok) setDescargados(new Set(grupos.map(g => g.key)))
  }

  const handleBorrar = async () => {
    if (confirmText !== "CONFIRMAR") return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/cierre-anio", { method: "DELETE" })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error ?? "Error al borrar")
        setDeleting(false)
        return
      }
      toast.success(`${json.eliminados} estudiantes eliminados correctamente`)
      setConfirmOpen(false)
      setDone(true)
    } catch {
      toast.error("Error de conexión")
    }
    setDeleting(false)
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
      <Loader2 className="size-4 animate-spin" /> Cargando datos...
    </div>
  )

  if (done) return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-green-500" />
      </div>
      <p className="font-semibold text-foreground">Cierre de año completado</p>
      <p className="text-sm text-muted-foreground">
        Todos los estudiantes e infracciones han sido eliminados del sistema.<br />
        Ya puedes importar los estudiantes del nuevo año escolar.
      </p>
    </div>
  )

  if (estudiantes.length === 0) return (
    <p className="text-sm text-muted-foreground py-4">No hay estudiantes activos en el sistema.</p>
  )

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{estudiantes.length}</p>
          <p className="text-xs text-muted-foreground">Estudiantes</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{infracciones.length}</p>
          <p className="text-xs text-muted-foreground">Infracciones</p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{grupos.length}</p>
          <p className="text-xs text-muted-foreground">Cursos</p>
        </div>
      </div>

      {/* Paso 1: Descargar PDFs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${todosDescargados ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"}`}>
              {todosDescargados ? "✓" : "1"}
            </div>
            <p className="text-sm font-semibold">Descargar historial por curso</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDescargarTodos}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Download className="size-3.5" />
            Descargar todos
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {grupos.map(({ key, count }) => {
            const descargado = descargados.has(key)
            const infsCount = infracciones.filter(i =>
              estudiantes.find(e => e.id === i.estudiante_id && `${e.curso} ${e.seccion}` === key)
            ).length
            return (
              <button
                key={key}
                onClick={() => handleDescargar(key)}
                className={`flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition-all cursor-pointer ${descargado
                  ? "border-green-200 bg-green-50"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
              >
                <div>
                  <p className="text-sm font-semibold">{key}</p>
                  <p className="text-xs text-muted-foreground">{count} est. · {infsCount} inf.</p>
                </div>
                {descargado
                  ? <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  : <Download className="size-4 text-muted-foreground shrink-0" />}
              </button>
            )
          })}
        </div>

        {!todosDescargados && (
          <p className="text-xs text-amber-600 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 shrink-0" />
            Descarga todos los PDFs antes de proceder al borrado.
            {descargados.size > 0 && ` (${descargados.size}/${grupos.length} descargados)`}
          </p>
        )}
      </div>

      <Separator />

      {/* Paso 2: Borrar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold ${todosDescargados ? "bg-destructive text-white" : "bg-muted text-muted-foreground"}`}>
            {todosDescargados ? "2" : <Lock className="size-3" />}
          </div>
          <p className={`text-sm font-semibold ${!todosDescargados ? "text-muted-foreground" : ""}`}>
            Borrar todos los estudiantes
          </p>
        </div>

        <div className={`rounded-lg border p-4 space-y-3 ${!todosDescargados ? "opacity-50 pointer-events-none" : "border-destructive/30 bg-destructive/5"}`}>
          <p className="text-sm text-destructive font-medium flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0" />
            Esta acción eliminará permanentemente todos los estudiantes e infracciones.
          </p>
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={!todosDescargados}
            className="w-full gap-2 cursor-pointer"
          >
            <Trash2 className="size-4" />
            Borrar todos los estudiantes
          </Button>
        </div>
      </div>

      {/* Dialog de confirmación */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              Cierre de Año Escolar {new Date().getFullYear()}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>Estás a punto de eliminar permanentemente:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li><strong>{estudiantes.length}</strong> estudiantes y sus cuentas de acceso</li>
                  <li><strong>{infracciones.length}</strong> infracciones registradas</li>
                </ul>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                  ⚠️ Asegúrate de haber guardado todos los PDFs antes de continuar. Esta acción no se puede deshacer.
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-foreground">
                    Escribe <span className="font-mono font-bold">CONFIRMAR</span> para continuar:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="CONFIRMAR"
                    className="font-mono"
                    autoComplete="off"
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} onClick={() => setConfirmText("")}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleBorrar}
              disabled={confirmText !== "CONFIRMAR" || deleting}
              className="cursor-pointer"
            >
              {deleting
                ? <><Loader2 className="size-4 animate-spin mr-2" />Eliminando...</>
                : <><Trash2 className="size-4 mr-2" />Sí, borrar todo</>}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ── Página de Configuración ───────────────────────────────
export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">Ajustes generales del sistema disciplinario</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información del Colegio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre del Colegio</Label>
              <p className="text-sm text-muted-foreground"> Módulo Educativo El Dorado</p>
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <p className="text-sm text-muted-foreground"> Santa Cruz, Bolivia</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cierre de Año */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            Cierre de Año Escolar
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Genera el historial disciplinario completo en PDF por curso y luego
            limpia el sistema para el nuevo año escolar.
          </p>
        </CardHeader>
        <CardContent>
          <CierreAnioSection />
        </CardContent>
      </Card>
    </div>
  )
}