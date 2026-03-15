"use client"

import { useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { toast } from "sonner"

interface Credencial {
  nombre_completo: string
  curso: string
  seccion: string
  codigo: string
  password: string
}

interface Props {
  credenciales: Credencial[]
  open: boolean
  onClose: () => void
}

const CURSO_ORDER: Record<string, number> = {
  "1ro": 1, "2do": 2, "3ro": 3, "4to": 4, "5to": 5, "6to": 6,
}

export function ImprimirCredencialesDialog({ credenciales, open, onClose }: Props) {
  const handlePrint = () => {
    if (!credenciales.length) return

    const fecha = new Date().toLocaleDateString("es-BO", {
      year: "numeric", month: "long", day: "numeric",
    })

    // Agrupar por curso + sección y ordenar
    const grupos = new Map<string, Credencial[]>()
    for (const c of credenciales) {
      const key = `${c.curso}||${c.seccion}`
      if (!grupos.has(key)) grupos.set(key, [])
      grupos.get(key)!.push(c)
    }

    const gruposOrdenados = Array.from(grupos.entries()).sort(([a], [b]) => {
      const [ca, sa] = a.split("||")
      const [cb, sb] = b.split("||")
      return (CURSO_ORDER[ca] ?? 99) - (CURSO_ORDER[cb] ?? 99) || sa.localeCompare(sb)
    })

    // Generar HTML de impresión directamente desde los datos
    const cursosHTML = gruposOrdenados.map(([key, alumnos], idx) => {
      const [curso, seccion] = key.split("||")
      const esUltimo = idx === gruposOrdenados.length - 1

      const cardsHTML = alumnos.map(c => `
        <div class="card">
          <div class="card-header">
            <span class="school">Módulo El Dorado</span>
            <span class="course-badge">${curso} ${seccion}</span>
          </div>
          <hr class="divider-top" />
          <p class="nombre">${c.nombre_completo}</p>
          <hr class="divider" />
          <div class="campo">
            <span class="label">USUARIO</span>
            <span class="valor">${c.codigo}</span>
          </div>
          <hr class="divider" />
          <div class="campo">
            <span class="label">CONTRASEÑA</span>
            <span class="valor">${c.password}</span>
          </div>
        </div>
      `).join("")

      return `
        <div class="curso-section${esUltimo ? "" : " page-break"}">
          <div class="curso-titulo">
            <span>${curso} — Sección ${seccion}</span>
            <span class="curso-count">${alumnos.length} estudiante${alumnos.length !== 1 ? "s" : ""}</span>
          </div>
          <div class="grid">${cardsHTML}</div>
        </div>
      `
    }).join("")

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Credenciales — Módulo Educativo El Dorado</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
      padding: 16px 20px;
      color: #111;
    }

    /* ── Cabecera ── */
    .doc-header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #0f1f3d;
    }
    .doc-header h1 {
      font-size: 15px;
      color: #0f1f3d;
      font-weight: bold;
      margin-bottom: 3px;
    }
    .doc-header p {
      font-size: 10px;
      color: #555;
    }

    /* ── Sección por curso ── */
    .curso-section { margin-bottom: 24px; }
    .page-break { page-break-after: always; }

    .curso-titulo {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f1f3d;
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      padding: 6px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .curso-count {
      font-weight: normal;
      font-size: 10px;
      opacity: 0.8;
    }

    /* ── Grid de tarjetas ── */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    /* ── Tarjeta individual ── */
    .card {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 10px 12px;
      page-break-inside: avoid;
      background: #fff;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .school {
      font-size: 9px;
      font-weight: bold;
      color: #0f1f3d;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .course-badge {
      font-size: 8px;
      background: #e0e7ff;
      color: #3730a3;
      padding: 1px 5px;
      border-radius: 10px;
      font-weight: bold;
    }
    .divider-top {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin-bottom: 7px;
    }
    .nombre {
      font-size: 11px;
      font-weight: bold;
      color: #111;
      line-height: 1.35;
      margin-bottom: 7px;
    }
    .divider {
      border: none;
      border-top: 1px dashed #e5e7eb;
      margin: 5px 0;
    }
    .campo {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
    }
    .label {
      font-size: 8px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .valor {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      font-weight: bold;
      color: #111;
      background: #f3f4f6;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    @media print {
      body { padding: 8px 12px; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>Módulo Educativo El Dorado — Credenciales de Acceso</h1>
    <p>Sistema Disciplinario · Generado el ${fecha} · ${credenciales.length} estudiante${credenciales.length !== 1 ? "s" : ""}</p>
  </div>

  ${cursosHTML}
</body>
</html>`

    const win = window.open("", "_blank", "width=950,height=750")
    if (!win) { toast.error("Permite ventanas emergentes para generar el PDF"); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  // Agrupar para la vista previa en el modal
  const grupos = new Map<string, Credencial[]>()
  for (const c of credenciales) {
    const key = `${c.curso} ${c.seccion}`
    if (!grupos.has(key)) grupos.set(key, [])
    grupos.get(key)!.push(c)
  }
  const gruposOrdenados = Array.from(grupos.entries()).sort(([a], [b]) => {
    const [ca, sa] = a.split(" ")
    const [cb, sb] = b.split(" ")
    return (CURSO_ORDER[ca] ?? 99) - (CURSO_ORDER[cb] ?? 99) || sa.localeCompare(sb)
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Credenciales — {credenciales.length} estudiante{credenciales.length !== 1 ? "s" : ""}
          </DialogTitle>
        </DialogHeader>

        {/* Vista previa agrupada por curso */}
        <div className="rounded-lg border bg-gray-50 p-4 max-h-[55vh] overflow-y-auto space-y-5">
          {gruposOrdenados.map(([key, alumnos]) => (
            <div key={key}>
              {/* Cabecera del curso */}
              <div className="flex items-center justify-between bg-[#0f1f3d] text-white text-xs font-semibold px-3 py-2 rounded-t-lg">
                <span>{key}</span>
                <span className="font-normal opacity-75">{alumnos.length} estudiante{alumnos.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Cards del curso */}
              <div className="grid gap-2 p-3 bg-white border border-t-0 rounded-b-lg"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))" }}>
                {alumnos.map((c, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-[#0f1f3d] uppercase tracking-wide">Módulo El Dorado</span>
                      <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">{key}</span>
                    </div>
                    <hr className="border-gray-100 mb-2" />
                    <p className="text-xs font-bold text-gray-900 leading-snug mb-2">{c.nombre_completo}</p>
                    <hr className="border-dashed border-gray-200 mb-1.5" />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wide">Usuario</span>
                      <span className="font-mono text-[11px] font-bold bg-gray-100 px-1.5 py-0.5 rounded">{c.codigo}</span>
                    </div>
                    <hr className="border-dashed border-gray-200 my-1.5" />
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-400 uppercase tracking-wide">Contraseña</span>
                      <span className="font-mono text-[11px] font-bold bg-gray-100 px-1.5 py-0.5 rounded">{c.password}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 cursor-pointer">
            Cancelar
          </Button>
          <Button
            onClick={handlePrint}
            className="flex-1 bg-[#0f1f3d] hover:bg-[#1a3461] text-white gap-2 cursor-pointer"
          >
            <Printer className="size-4" />
            Imprimir / Guardar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}