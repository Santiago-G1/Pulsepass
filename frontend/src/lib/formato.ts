export const formatoFecha = (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(new Date(value))

export const formatoFechaCorta = (value: string | Date) =>
  new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

export const formatoCOP = (value: number | string) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(value))
