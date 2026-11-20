import { z } from 'zod'

const ErrorResponseSchema = z
  .object({
    timestamp: z.string().optional(),
    status: z.number().optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    details: z.record(z.string(), z.string()).optional(),
  })
  .passthrough()

const TokenSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number().finite(),
})

const SESSION_KEY = 'pulsepass.session'
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'
let accessToken: string | null = null

export class ApiError extends Error {
  readonly status: number
  readonly details: Record<string, string>

  constructor(
    status: number,
    message: string,
    details: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export interface TokenSession {
  accessToken: string
  expiresAt: number
}

export const readTokenSession = (): TokenSession | null => {
  const raw = window.sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    window.sessionStorage.removeItem(SESSION_KEY)
    return null
  }

  const result = TokenSessionSchema.safeParse(parsed)
  if (!result.success || result.data.expiresAt <= Date.now()) {
    window.sessionStorage.removeItem(SESSION_KEY)
    return null
  }
  return result.data
}

export const saveTokenSession = (session: TokenSession): void => {
  TokenSessionSchema.parse(session)
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  accessToken = session.accessToken
}

export const clearTokenSession = (): void => {
  window.sessionStorage.removeItem(SESSION_KEY)
  accessToken = null
}

export const setAccessToken = (token: string | null): void => {
  accessToken = token
}

const errorFromResponse = async (response: Response): Promise<ApiError> => {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return new ApiError(response.status, 'No fue posible completar la solicitud.')
  }

  const result = ErrorResponseSchema.safeParse(body)
  if (!result.success) {
    return new ApiError(response.status, 'No fue posible completar la solicitud.')
  }

  const details = result.data.details ?? {}
  const message =
    response.status === 401
      ? 'Credenciales inválidas.'
      : result.data.message ?? 'No fue posible completar la solicitud.'
  return new ApiError(response.status, message, details)
}

export const request = async (path: string, init: RequestInit = {}): Promise<unknown> => {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      throw new ApiError(0, 'No fue posible conectarse con PulsePass. Inténtalo de nuevo.')
    }
    throw error
  }

  if (response.status === 401) {
    window.dispatchEvent(new Event('pulsepass:unauthorized'))
  }
  if (!response.ok) throw await errorFromResponse(response)
  if (response.status === 204) return undefined

  try {
    return await response.json()
  } catch {
    throw new ApiError(response.status, 'La respuesta del servidor no es válida.')
  }
}

export const parseResponse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new ApiError(502, 'El servidor devolvió datos con un formato inesperado.')
  }
  return result.data
}
