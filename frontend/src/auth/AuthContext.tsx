import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { UsuarioAutenticado } from '../lib/contratos'
import {
  clearTokenSession,
  readTokenSession,
  saveTokenSession,
  setAccessToken,
} from '../lib/http'
import { iniciarSesion, obtenerSesion } from '../features/auth/api'
import { AuthContext, type EstadoSesion } from './contexto'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [sesion, setSesion] = useState<EstadoSesion>({ estado: 'cargando' })
  const [motivoSesionExpirada, setMotivoSesionExpirada] = useState(false)

  const cerrar = useCallback((motivo?: 'expirada') => {
    clearTokenSession()
    queryClient.clear()
    setMotivoSesionExpirada(motivo === 'expirada')
    setSesion({ estado: 'anonimo' })
  }, [queryClient])

  const cargarSesion = useCallback(async () => {
    const tokenSession = readTokenSession()
    if (!tokenSession) {
      setAccessToken(null)
      setSesion({ estado: 'anonimo' })
      return
    }

    setAccessToken(tokenSession.accessToken)
    setSesion({ estado: 'cargando' })
    try {
      const usuario = await obtenerSesion()
      setSesion({ estado: 'autenticado', usuario })
    } catch (error: unknown) {
      if (error instanceof Error && 'status' in error && error.status === 401) {
        cerrar('expirada')
        return
      }
      setSesion({
        estado: 'error',
        mensaje: 'No fue posible verificar tu sesión. Comprueba tu conexión e inténtalo de nuevo.',
      })
    }
  }, [cerrar])

  useEffect(() => {
    void cargarSesion()
    const onUnauthorized = () => cerrar('expirada')
    window.addEventListener('pulsepass:unauthorized', onUnauthorized)
    return () => window.removeEventListener('pulsepass:unauthorized', onUnauthorized)
  }, [cargarSesion, cerrar])

  useEffect(() => {
    if (sesion.estado !== 'autenticado') return
    const tokenSession = readTokenSession()
    if (!tokenSession) {
      cerrar('expirada')
      return
    }
    const timeout = window.setTimeout(
      () => cerrar('expirada'),
      Math.max(0, tokenSession.expiresAt - Date.now()),
    )
    return () => window.clearTimeout(timeout)
  }, [sesion, cerrar])

  const iniciar = useCallback(
    async (identifier: string, password: string) => {
      const token = await iniciarSesion({ identifier, password })
      saveTokenSession({
        accessToken: token.accessToken,
        expiresAt: Date.now() + token.expiresIn * 1000,
      })
      try {
        const usuario: UsuarioAutenticado = await obtenerSesion()
        setSesion({ estado: 'autenticado', usuario })
      } catch (error: unknown) {
        cerrar()
        throw error
      }
    },
    [cerrar],
  )

  const value = useMemo(
    () => ({
      sesion,
      motivoSesionExpirada,
      iniciar,
      cerrar,
      reintentar: () => void cargarSesion(),
    }),
    [sesion, motivoSesionExpirada, iniciar, cerrar, cargarSesion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
