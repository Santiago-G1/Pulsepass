import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../auth/contexto'
import {
  Aviso,
  Badge,
  Boton,
  Cargando,
  Campo,
  EstadoError,
  EstadoVacio,
  Modal,
  Selector,
  Tarjeta,
  TarjetaEvento,
} from '../componentes/ui'
import {
  CATEGORIAS,
  type Categoria,
  type TipoTicket,
  TipoTicketSchema,
} from '../lib/contratos'
import { esNoEncontrado, mensajeError } from '../lib/errores'
import { formatoFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'
import {
  useArtistasActivos,
  useEvento,
  useEventosPorArtista,
  useEventosPublicados,
} from '../features/eventos/api'
import { useComprarTicket } from '../features/tickets/api'

const categorias = Object.keys(CATEGORIAS) as Categoria[]

export function CatalogoEventos() {
  const [params, setParams] = useSearchParams()
  const texto = params.get('q') ?? ''
  const categoria = params.get('categoria') ?? ''
  const artista = params.get('artista') ?? ''
  const artistas = useArtistasActivos()
  const todos = useEventosPublicados()
  const porArtista = useEventosPorArtista(artista)
  const consulta = artista ? porArtista : todos
  const eventos =
    consulta.data?.filter(
      (evento) =>
        evento.name.toLocaleLowerCase().includes(texto.toLocaleLowerCase()) &&
        (!categoria || evento.category === categoria),
    ) ?? []

  const actualizar = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-marca-600">Encuentra tu próximo plan</p>
        <h1 className="mt-1 text-3xl font-extrabold">Cartelera</h1>
      </div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] dark:border-slate-800 dark:bg-slate-900">
        <Campo
          etiqueta="Buscar por nombre"
          name="q"
          placeholder="Ej. música, festival…"
          value={texto}
          onChange={(event) => actualizar('q', event.target.value)}
        />
        <Selector
          etiqueta="Categoría"
          name="categoria"
          value={categoria}
          onChange={(event) => actualizar('categoria', event.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((item) => <option key={item} value={item}>{CATEGORIAS[item]}</option>)}
        </Selector>
        <Selector
          etiqueta="Artista"
          name="artista"
          value={artista}
          onChange={(event) => actualizar('artista', event.target.value)}
        >
          <option value="">Todos los artistas</option>
          {artistas.data?.map((item) => (
            <option key={item.id} value={item.stageName}>{item.stageName}</option>
          ))}
        </Selector>
        <Boton
          className="self-end"
          variante="secundario"
          onClick={() => setParams({}, { replace: true })}
        >
          Limpiar
        </Boton>
      </div>
      {consulta.isPending ? (
        <Cargando />
      ) : consulta.isError ? (
        <EstadoError
          mensaje={mensajeError(consulta.error, 'No pudimos cargar la cartelera.')}
          onReintentar={() => void consulta.refetch()}
        />
      ) : eventos.length === 0 ? (
        <EstadoVacio titulo="Sin resultados para tu búsqueda" mensaje="Prueba con otros filtros o limpia la búsqueda." />
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400">{eventos.length} evento{eventos.length === 1 ? '' : 's'}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {eventos.map((evento) => <TarjetaEvento evento={evento} key={evento.eventCode} />)}
          </div>
        </>
      )}
    </div>
  )
}

export function DetalleEvento() {
  const { eventCode = '' } = useParams()
  const evento = useEvento(eventCode)
  const { sesion } = useAuth()
  const comprar = useComprarTicket()
  const navigate = useNavigate()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tipo, setTipo] = useState<TipoTicket>('GENERAL')
  const [errorCompra, setErrorCompra] = useState('')

  if (evento.isPending) return <Cargando />
  if (evento.isError && esNoEncontrado(evento.error)) {
    return <EstadoVacio titulo="Evento no disponible" mensaje="No encontramos un evento publicado con ese código." />
  }
  if (evento.isError || !evento.data) {
    return <EstadoError mensaje={mensajeError(evento.error)} onReintentar={() => void evento.refetch()} />
  }

  const data = evento.data
  const sede = data.sede ?? data.venue
  const disponible = data.status === 'PUBLISHED'
  const enviarCompra = async () => {
    const parsedType = TipoTicketSchema.safeParse(tipo)
    if (!parsedType.success) return
    if (sesion.estado !== 'autenticado') {
      navigate(RUTAS.login, { state: { desde: { pathname: RUTAS.evento(eventCode) } } })
      return
    }
    setErrorCompra('')
    try {
      const ticket = await comprar.mutateAsync({
        userEmail: sesion.usuario.email,
        eventCode,
        type: parsedType.data,
      })
      navigate(RUTAS.confirmacion(ticket.ticketCode))
    } catch (error: unknown) {
      setErrorCompra(mensajeError(error, 'No pudimos completar la compra.'))
    }
  }

  return (
    <div className="space-y-7">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-marca-600 to-rose-500 p-7 text-white sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">{CATEGORIAS[data.category]}</span>
          <Badge estado={data.status} />
        </div>
        <h1 className="mt-5 max-w-3xl text-3xl font-extrabold sm:text-5xl">{data.name}</h1>
        <p className="mt-3 text-indigo-50">{formatoFecha(data.eventDate)}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Tarjeta>
            <h2 className="text-xl font-bold">Sobre el evento</h2>
            <p className="mt-3 whitespace-pre-line leading-7 text-slate-600 dark:text-slate-300">
              {data.description || 'Conoce una experiencia única en PulsePass.'}
            </p>
            <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
              <div><dt className="text-sm text-slate-500">Edad mínima</dt><dd className="mt-1 font-semibold">{data.minimumAge ?? 'Sin restricción indicada'}</dd></div>
              <div><dt className="text-sm text-slate-500">Código</dt><dd className="mt-1 font-semibold">{data.eventCode}</dd></div>
            </dl>
          </Tarjeta>
          <Tarjeta>
            <h2 className="text-xl font-bold">Lugar</h2>
            {sede ? (
              <div className="mt-3">
                <p className="font-semibold">{sede.name}</p>
                <p className="text-slate-600 dark:text-slate-400">{sede.city} · Capacidad {sede.capacity}</p>
                <Link className="mt-3 inline-block font-semibold text-marca-700 hover:underline dark:text-indigo-300" to={RUTAS.sede(sede.code)}>Ver sede →</Link>
              </div>
            ) : <p className="mt-3 text-slate-600 dark:text-slate-400">{data.venueName ?? 'Lugar por confirmar'}</p>}
          </Tarjeta>
          <Tarjeta>
            <h2 className="text-xl font-bold">Artistas</h2>
            {data.artists?.length ? (
              <div className="mt-4 flex flex-wrap gap-3">
                {data.artists.map((artist) => (
                  <Link className="rounded-xl bg-indigo-50 px-4 py-2 font-semibold text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200" key={artist.id} to={RUTAS.artista(artist.id)}>
                    {artist.stageName}
                  </Link>
                ))}
              </div>
            ) : <p className="mt-3 text-slate-600 dark:text-slate-400">Pronto anunciaremos los artistas.</p>}
          </Tarjeta>
        </div>
        <Tarjeta className="h-fit lg:sticky lg:top-24">
          <h2 className="text-xl font-bold">Asegura tu entrada</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">El precio y la disponibilidad son confirmados por el servidor.</p>
          <Boton className="mt-5 w-full" disabled={!disponible} onClick={() => {
            if (sesion.estado !== 'autenticado') {
              navigate(RUTAS.login, { state: { desde: { pathname: RUTAS.evento(eventCode) } } })
            } else {
              setModalAbierto(true)
            }
          }}>
            {disponible ? 'Comprar entrada' : 'Compra no disponible'}
          </Boton>
          {!disponible && <p className="mt-3 text-sm text-slate-500">Este evento no está disponible para compra.</p>}
        </Tarjeta>
      </div>

      <Modal abierto={modalAbierto} titulo="Confirmar compra" onCerrar={() => setModalAbierto(false)}>
        <p className="text-slate-600 dark:text-slate-300">Selecciona el tipo de entrada para {data.name}.</p>
        <Selector className="mt-4" etiqueta="Tipo de entrada" name="tipo-ticket" value={tipo} onChange={(event) => {
          const parsed = TipoTicketSchema.safeParse(event.target.value)
          if (parsed.success) setTipo(parsed.data)
        }}>
          <option value="GENERAL">General</option>
          <option value="VIP">VIP</option>
          <option value="BACKSTAGE">Backstage</option>
          <option value="STUDENT">Estudiante</option>
        </Selector>
        {errorCompra && <Aviso>{errorCompra}</Aviso>}
        <div className="mt-5 flex justify-end gap-3">
          <Boton variante="secundario" onClick={() => setModalAbierto(false)}>Volver</Boton>
          <Boton cargando={comprar.isPending} onClick={() => void enviarCompra()}>Confirmar compra</Boton>
        </div>
      </Modal>
    </div>
  )
}
