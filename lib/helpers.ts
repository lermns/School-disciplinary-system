import type { Gravedad } from './types';

export function getGravedadConfig(gravedad: Gravedad) {
  switch (gravedad) {
    case 'leve':
      return {
        label: 'Leve',
        className: 'bg-success/10 text-success border-success/20',
        dotColor: 'bg-success',
      };
    case 'grave':
      return {
        label: 'Grave',
        className: 'bg-warning/10 text-warning border-warning/20',
        dotColor: 'bg-warning',
      };
    case 'muy_grave':
      return {
        label: 'Muy Grave',
        className: 'bg-destructive/10 text-destructive border-destructive/20',
        dotColor: 'bg-destructive',
      };
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
