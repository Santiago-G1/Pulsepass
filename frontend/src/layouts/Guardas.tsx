import { Navigate, Outlet, useLocation } from 'react-router'
import type { Rol } from '../lib/contratos'
import { RUTAS } from '../lib/rutas'
import { useAuth } from '../auth/contexto'
import { Cargando, EstadoError } from '../componentes/ui'

export function RutaProtegida() {
  const { sesion, reintentar, motivoSesionExpirada } = useAuth()
  const location = useLocation()
  if (sesion.estado === 'cargando') return <Cargando mensaje="Verificando sesión…" />
  if (sesion.estado === 'error') {
    return <EstadoError mensaje={sesion.mensaje} onReintentar={reintentar} />
  }
  if (sesion.estado === 'anonimo') {
    return (
      <Navigate
        to={RUTAS.login}
        replace
        state={{
          desde: location,
          mensaje: motivoSesionExpirada ? 'Tu sesión expiró. Inicia sesión de nuevo.' : undefined,
          motivo: motivoSesionExpirada ? 'expirada' : undefined,
        }}
      />
    )
  }
  return <Outlet />
}

export function RutaPorRol({ roles }: { roles: Rol[] }) {
  const { sesion } = useAuth()
  if (sesion.estado !== 'autenticado') return <Navigate to={RUTAS.login} replace />
  if (!sesion.usuario.roles.some((role) => roles.includes(role))) {
    return <Navigate to={RUTAS.sinPermisos} replace />
  }
  return <Outlet />
}

export function SoloAnonimo() {
  const { sesion } = useAuth()
  if (sesion.estado === 'cargando') return <Cargando mensaje="Verificando sesión…" />
  if (sesion.estado === 'autenticado') return <Navigate to={RUTAS.inicio} replace />
  return <Outlet />
}
