import { Link, useParams } from 'react-router'
import {
  Cargando,
  EstadoError,
  EstadoVacio,
  Tarjeta,
  TarjetaEvento,
} from '../componentes/ui'
import {
  useArtista,
  useArtistaPorNombre,
  useArtistasActivos,
  useEventosPorArtista,
  useSede,
  useSedesActivas,
} from '../features/eventos/api'
import { esNoEncontrado, mensajeError } from '../lib/errores'
import { RUTAS } from '../lib/rutas'

export function ListaArtistas() {
  const artistas = useArtistasActivos()
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-acento-500">Talento en escena</p>
        <h1 className="mt-1 text-3xl font-extrabold">Artistas</h1>
      </header>
      {artistas.isPending ? <Cargando /> : artistas.isError ? (
        <EstadoError mensaje={mensajeError(artistas.error)} onReintentar={() => void artistas.refetch()} />
      ) : artistas.data.length === 0 ? (
        <EstadoVacio titulo="No hay artistas activos" mensaje="Vuelve pronto para descubrir nuevos artistas." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {artistas.data.map((artista) => (
            <Link
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              key={artista.id}
              to={RUTAS.artista(artista.id)}
            >
              <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-indigo-200 to-rose-200 text-2xl font-extrabold text-indigo-900 dark:from-indigo-950 dark:to-rose-950 dark:text-indigo-100">
                {artista.stageName.slice(0, 1).toUpperCase()}
              </span>
              <h2 className="mt-4 text-xl font-bold group-hover:text-marca-700 dark:group-hover:text-indigo-300">{artista.stageName}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{artista.description ?? artista.biography ?? 'Artista de PulsePass'}</p>
              <span className="mt-5 inline-block font-semibold text-marca-700 dark:text-indigo-300">Ver perfil →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function DetalleArtista() {
  const { id = '' } = useParams()
  const esIdNumerico = /^\d+$/.test(id)
  const artista = useArtista(id)
  const artistaPorNombre = useArtistaPorNombre(esIdNumerico ? '' : id)
  const seleccionado = esIdNumerico ? artista.data : artistaPorNombre.data
  const eventos = useEventosPorArtista(seleccionado?.stageName ?? '')

  if (!esIdNumerico) {
    if (artistaPorNombre.isPending) return <Cargando />
    if (artistaPorNombre.isError) {
      return <EstadoError mensaje={mensajeError(artistaPorNombre.error)} onReintentar={() => void artistaPorNombre.refetch()} />
    }
    if (!seleccionado) return <EstadoVacio titulo="Artista no encontrado" mensaje="Comprueba el enlace e inténtalo de nuevo." />
  } else if (artista.isPending) {
    return <Cargando />
  } else if (artista.isError && esNoEncontrado(artista.error)) {
    return <EstadoVacio titulo="Artista no encontrado" mensaje="No encontramos un perfil con ese identificador." />
  } else if (artista.isError) {
    return <EstadoError mensaje={mensajeError(artista.error)} onReintentar={() => void artista.refetch()} />
  }

  if (!seleccionado) return <Cargando />
  return (
    <div className="space-y-8">
      <Tarjeta className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="grid size-24 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-200 to-rose-200 text-4xl font-extrabold text-indigo-900 dark:from-indigo-950 dark:to-rose-950 dark:text-indigo-100">
          {seleccionado.stageName.slice(0, 1).toUpperCase()}
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-acento-500">Artista</p>
          <h1 className="mt-1 text-3xl font-extrabold">{seleccionado.stageName}</h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">{seleccionado.description ?? seleccionado.biography ?? 'Descubre sus próximos eventos en PulsePass.'}</p>
        </div>
      </Tarjeta>
      <section>
        <h2 className="mb-4 text-2xl font-bold">Próximos eventos</h2>
        {eventos.isPending ? <Cargando /> : eventos.isError ? (
          <EstadoError mensaje={mensajeError(eventos.error)} onReintentar={() => void eventos.refetch()} />
        ) : eventos.data.length === 0 ? (
          <EstadoVacio titulo="No hay eventos próximos" mensaje="Todavía no hay eventos publicados para este artista." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.data.map((evento) => <TarjetaEvento evento={evento} key={evento.eventCode} />)}
          </div>
        )}
      </section>
    </div>
  )
}

export function ListaSedes() {
  const sedes = useSedesActivas()
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-marca-600">Lugares para vivirlo</p>
        <h1 className="mt-1 text-3xl font-extrabold">Sedes</h1>
      </header>
      {sedes.isPending ? <Cargando /> : sedes.isError ? (
        <EstadoError mensaje={mensajeError(sedes.error)} onReintentar={() => void sedes.refetch()} />
      ) : sedes.data.length === 0 ? (
        <EstadoVacio titulo="No hay sedes activas" mensaje="Vuelve pronto para conocer nuevos lugares." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sedes.data.map((sede) => (
            <Link
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              key={sede.code}
              to={RUTAS.sede(sede.code)}
            >
              <div className="grid h-32 place-items-center bg-gradient-to-br from-sky-600 to-indigo-700 text-4xl text-white" aria-hidden="true">⌖</div>
              <div className="p-5">
                <h2 className="text-xl font-bold group-hover:text-marca-700 dark:group-hover:text-indigo-300">{sede.name}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{sede.city}</p>
                <p className="mt-1 text-sm text-slate-500">Capacidad: {sede.capacity.toLocaleString('es-CO')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function DetalleSede() {
  const { code = '' } = useParams()
  const sede = useSede(code)
  if (sede.isPending) return <Cargando />
  if (sede.isError && esNoEncontrado(sede.error)) {
    return <EstadoVacio titulo="Sede no encontrada" mensaje="No encontramos una sede con ese código." />
  }
  if (sede.isError || !sede.data) {
    return <EstadoError mensaje={mensajeError(sede.error)} onReintentar={() => void sede.refetch()} />
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-sky-700 to-indigo-800 p-8 text-white sm:p-12">
        <p className="text-sm font-bold uppercase tracking-widest text-sky-100">Sede de eventos</p>
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{sede.data.name}</h1>
        <p className="mt-3 text-lg text-sky-100">{sede.data.city}</p>
      </div>
      <Tarjeta>
        <dl className="grid gap-5 sm:grid-cols-2">
          <div><dt className="text-sm text-slate-500">Código</dt><dd className="mt-1 font-semibold">{sede.data.code}</dd></div>
          <div><dt className="text-sm text-slate-500">Capacidad</dt><dd className="mt-1 font-semibold">{sede.data.capacity.toLocaleString('es-CO')} personas</dd></div>
          <div><dt className="text-sm text-slate-500">Estado</dt><dd className="mt-1 font-semibold">{sede.data.active ? 'Activa' : 'Inactiva'}</dd></div>
        </dl>
      </Tarjeta>
      <Link to={RUTAS.eventos} className="inline-flex min-h-11 items-center font-semibold text-marca-700 hover:underline dark:text-indigo-300">Ver eventos →</Link>
    </div>
  )
}
