import { ApiError } from './http'

export const mensajeError = (
  error: unknown,
  fallback = 'Ocurrió un error inesperado. Inténtalo más tarde.',
) => {
  if (!(error instanceof ApiError)) return fallback
  if (error.status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.'
  if (error.status === 403) return 'No tienes permisos para realizar esta acción.'
  if (error.status === 404) return 'No encontramos la información solicitada.'
  if (error.status >= 500) return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  return error.message
}

export const esNoEncontrado = (error: unknown) =>
  error instanceof ApiError && (error.status === 403 || error.status === 404)
