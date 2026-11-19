import { createContext, useContext } from 'react'
import type { UsuarioAutenticado } from '../lib/contratos'

export type EstadoSesion =
  | { estado: 'cargando' }
  | { estado: 'anonimo' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'autenticado'; usuario: UsuarioAutenticado }

export interface AuthContextValue {
  sesion: EstadoSesion
  iniciar: (identifier: string, password: string) => Promise<void>
  cerrar: () => void
  reintentar: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return value
}
