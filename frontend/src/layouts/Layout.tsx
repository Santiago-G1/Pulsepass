import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import clsx from 'clsx'
import { useAuth } from '../auth/contexto'
import type { Rol } from '../lib/contratos'
import { RUTAS } from '../lib/rutas'
import { Boton } from '../componentes/ui'

const enlacesRol: Record<Rol, { texto: string; href: string }[]> = {
  USER: [
    { texto: 'Mi cuenta', href: RUTAS.cuenta },
    { texto: 'Mis tickets', href: RUTAS.misTickets },
  ],
  STAFF: [
    { texto: 'Validar ingreso', href: RUTAS.validacionStaff },
    { texto: 'Tickets por evento', href: RUTAS.ticketsEvento('CMF-2026') },
  ],
  ADMIN: [
    { texto: 'Administrar eventos', href: RUTAS.adminEventos },
    { texto: 'Nuevo evento', href: RUTAS.nuevoEvento },
  ],
}

export function Layout() {
  const { sesion, cerrar } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [oscuro, setOscuro] = useState(() => {
    try {
      const guardado = window.localStorage?.getItem('pulsepass.theme')
      if (guardado === 'dark') return true
      if (guardado === 'light') return false
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    } catch {
      return false
    }
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro)
    try {
      window.localStorage?.setItem('pulsepass.theme', oscuro ? 'dark' : 'light')
    } catch {
      // El tema sigue funcionando aunque el navegador bloquee storage.
    }
  }, [oscuro])

  const rol = sesion.estado === 'autenticado' ? sesion.usuario.roles[0] : undefined
  const enlacesUsuario = rol ? enlacesRol[rol] : []

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    clsx(
      'flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors',
      isActive
        ? 'bg-indigo-50 text-marca-700 dark:bg-indigo-950 dark:text-indigo-200'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
    )

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#contenido"
        className="sr-only z-[60] rounded bg-white p-3 text-slate-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link
            to={RUTAS.inicio}
            className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight text-slate-950 dark:text-white"
            onClick={() => setMenuAbierto(false)}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-marca-600 to-acento-500 text-white" aria-hidden="true">♪</span>
            PulsePass
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
            <NavLink to={RUTAS.eventos} className={itemClass}>Eventos</NavLink>
            <NavLink to={RUTAS.artistas} className={itemClass}>Artistas</NavLink>
            <NavLink to={RUTAS.sedes} className={itemClass}>Sedes</NavLink>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {enlacesUsuario.map((enlace) => (
              <NavLink key={enlace.href} to={enlace.href} className={itemClass}>
                {enlace.texto}
              </NavLink>
            ))}
            <button
              type="button"
              className="min-h-11 min-w-11 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={oscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
              onClick={() => setOscuro((value) => !value)}
            >
              {oscuro ? '☀' : '◐'}
            </button>
            {sesion.estado === 'autenticado' ? (
              <div className="flex items-center gap-2">
                <span className="max-w-32 truncate text-sm font-semibold">
                  {sesion.usuario.firstName ?? sesion.usuario.username}
                </span>
                <Boton variante="fantasma" onClick={() => cerrar()}>Salir</Boton>
              </div>
            ) : (
              <>
                <NavLink to={RUTAS.login} className={itemClass}>Ingresar</NavLink>
                <Link to={RUTAS.registro}>
                  <Boton>Registrarse</Boton>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="grid min-h-11 min-w-11 place-items-center rounded-lg text-xl hover:bg-slate-100 focus-visible:outline-2 md:hidden dark:hover:bg-slate-800"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            onClick={() => setMenuAbierto((value) => !value)}
          >
            {menuAbierto ? '×' : '☰'}
          </button>
        </div>
        {menuAbierto && (
          <nav
            id="menu-movil"
            aria-label="Navegación móvil"
            className="grid gap-1 border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800"
          >
            {[
              { texto: 'Eventos', href: RUTAS.eventos },
              { texto: 'Artistas', href: RUTAS.artistas },
              { texto: 'Sedes', href: RUTAS.sedes },
              ...enlacesUsuario,
            ].map((enlace) => (
              <NavLink
                key={enlace.href}
                to={enlace.href}
                className={itemClass}
                onClick={() => setMenuAbierto(false)}
              >
                {enlace.texto}
              </NavLink>
            ))}
            {sesion.estado === 'autenticado' ? (
              <button
                className="min-h-11 rounded-lg px-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                onClick={() => { cerrar(); setMenuAbierto(false) }}
                type="button"
              >
                Salir de la cuenta
              </button>
            ) : (
              <>
                <NavLink to={RUTAS.login} className={itemClass} onClick={() => setMenuAbierto(false)}>Ingresar</NavLink>
                <NavLink to={RUTAS.registro} className={itemClass} onClick={() => setMenuAbierto(false)}>Registrarse</NavLink>
              </>
            )}
            <button
              type="button"
              className="min-h-11 rounded-lg px-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              onClick={() => setOscuro((value) => !value)}
            >
              {oscuro ? 'Usar modo claro' : 'Usar modo oscuro'}
            </button>
          </nav>
        )}
      </header>

      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
          <span>© 2026 PulsePass · Caso de estudio académico</span>
          <div className="flex gap-4">
            <Link className="hover:text-marca-600" to={RUTAS.sedes}>Sedes</Link>
            <Link className="hover:text-marca-600" to={RUTAS.artistas}>Artistas</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
