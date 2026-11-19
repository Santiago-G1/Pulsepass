import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { Boton } from '../componentes/ui'
import { RUTAS } from '../lib/rutas'

export function SinPermisos() {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-xl content-center justify-items-center text-center">
      <p className="text-6xl font-black text-marca-600">403</p>
      <h1 className="mt-4 text-2xl font-extrabold">No tienes permisos para acceder a esta sección.</h1>
      <Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-marca-600 px-5 font-semibold text-white hover:bg-marca-700" to={RUTAS.inicio}>Volver al inicio</Link>
    </div>
  )
}

export function NoEncontrada() {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-xl content-center justify-items-center text-center">
      <p className="text-6xl font-black text-marca-600">404</p>
      <h1 className="mt-4 text-2xl font-extrabold">No encontramos esta página.</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Puede que el enlace haya cambiado o ya no exista.</p>
      <Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-marca-600 px-5 font-semibold text-white hover:bg-marca-700" to={RUTAS.inicio}>Volver al inicio</Link>
    </div>
  )
}

export function ErrorPagina() {
  const error = useRouteError()
  const mensaje = isRouteErrorResponse(error)
    ? 'No fue posible abrir esta página.'
    : 'Ocurrió un error inesperado. Inténtalo más tarde.'
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-xl content-center justify-items-center text-center">
      <span className="text-5xl" aria-hidden="true">!</span>
      <h1 className="mt-4 text-2xl font-extrabold">¡Ups! Algo salió mal.</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400" role="alert">{mensaje}</p>
      <Link className="mt-6" to={RUTAS.inicio}><Boton>Volver al inicio</Boton></Link>
    </div>
  )
}
