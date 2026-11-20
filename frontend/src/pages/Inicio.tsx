import { Link } from 'react-router'
import { useAuth } from '../auth/contexto'
import {
  Cargando,
  EstadoError,
  EstadoVacio,
  TarjetaEvento,
} from '../componentes/ui'
import { useArtistasActivos, useEventosPublicados } from '../features/eventos/api'
import { mensajeError } from '../lib/errores'
import { RUTAS } from '../lib/rutas'

export default function Inicio() {
  const eventos = useEventosPublicados()
  const artistas = useArtistasActivos()
  const { sesion } = useAuth()

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-marca-700 via-indigo-600 to-acento-500 px-6 py-12 text-white shadow-xl sm:px-10 sm:py-16 lg:px-14">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-sm font-semibold backdrop-blur">
            Tu próximo plan empieza aquí
          </p>
          <h1 className="font-titulo text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Descubre los mejores eventos
          </h1>
          <p className="mt-5 max-w-xl text-lg text-indigo-50">
            Música, cultura, deporte y tecnología en un solo lugar. Encuentra
            experiencias para recordar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={RUTAS.eventos}
              className="inline-flex min-h-12 items-center rounded-xl bg-white px-5 font-bold text-indigo-800 transition hover:bg-indigo-50"
            >
              Ver cartelera
            </Link>
            {sesion.estado !== 'autenticado' && (
              <Link
                to={RUTAS.registro}
                className="inline-flex min-h-12 items-center rounded-xl border border-white/50 px-5 font-semibold text-white transition hover:bg-white/10"
              >
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="eventos-destacados">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-marca-600">En vivo, cerca de ti</p>
            <h2 className="mt-1 text-2xl font-extrabold" id="eventos-destacados">Próximos eventos</h2>
          </div>
          <Link className="font-semibold text-marca-700 hover:underline dark:text-indigo-300" to={RUTAS.eventos}>
            Ver todos <span aria-hidden="true">→</span>
          </Link>
        </div>
        {eventos.isPending ? (
          <Cargando />
        ) : eventos.isError ? (
          <EstadoError
            mensaje={mensajeError(eventos.error, 'No pudimos cargar los eventos.')}
            onReintentar={() => void eventos.refetch()}
          />
        ) : eventos.data.length === 0 ? (
          <EstadoVacio titulo="Aún no hay eventos publicados" mensaje="Vuelve pronto para descubrir nuevos planes." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.data.slice(0, 3).map((evento) => (
              <TarjetaEvento evento={evento} key={evento.eventCode} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="artistas-destacados">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-acento-500">Las voces del escenario</p>
            <h2 className="mt-1 text-2xl font-extrabold" id="artistas-destacados">Artistas destacados</h2>
          </div>
          <Link className="font-semibold text-marca-700 hover:underline dark:text-indigo-300" to={RUTAS.artistas}>
            Ver todos <span aria-hidden="true">→</span>
          </Link>
        </div>
        {artistas.isPending ? (
          <Cargando />
        ) : artistas.isError ? (
          <EstadoError
            mensaje={mensajeError(artistas.error, 'No pudimos cargar los artistas.')}
            onReintentar={() => void artistas.refetch()}
          />
        ) : artistas.data.length === 0 ? (
          <EstadoVacio titulo="Pronto habrá artistas" mensaje="Estamos preparando nuevos eventos y artistas." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artistas.data.slice(0, 6).map((artista) => (
              <Link
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                key={artista.id}
                to={RUTAS.artista(artista.id)}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-200 to-rose-200 text-lg font-bold text-indigo-900 dark:from-indigo-950 dark:to-rose-950 dark:text-indigo-100">
                  {artista.stageName.slice(0, 1).toUpperCase()}
                </span>
                <span className="font-semibold group-hover:text-marca-700 dark:group-hover:text-indigo-300">{artista.stageName}</span>
                <span className="ml-auto text-slate-400" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
