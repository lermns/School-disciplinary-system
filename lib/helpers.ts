import type { Gravedad, EstadoInfraccion } from "./types"

export function getGravedadConfig(gravedad: Gravedad) {
  switch (gravedad) {
    case "leve":
      return {
        label: "Leve",
        className: "bg-success/10 text-success border-success/20",
        dotColor: "bg-success",
      }
    case "grave":
      return {
        label: "Grave",
        className: "bg-warning/10 text-warning border-warning/20",
        dotColor: "bg-warning",
      }
    case "muy_grave":
      return {
        label: "Muy Grave",
        className: "bg-destructive/10 text-destructive border-destructive/20",
        dotColor: "bg-destructive",
      }
  }
}

export function getEstadoConfig(estado: EstadoInfraccion) {
  switch (estado) {
    case "pendiente":
      return {
        label: "Pendiente",
        className: "bg-warning/10 text-warning border-warning/20",
      }
    case "resuelto":
      return {
        label: "Resuelto",
        className: "bg-success/10 text-success border-success/20",
      }
    case "apelado":
      return {
        label: "Apelado",
        className: "bg-chart-2/10 text-chart-2 border-chart-2/20",
      }
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
