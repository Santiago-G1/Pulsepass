import { useState } from 'react'
import type { FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { z } from 'zod'
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
} from '../componentes/ui'
import {
  CATEGORIAS,
  CategoriaSchema,
} from '../lib/contratos'
import { esNoEncontrado, mensajeError } from '../lib/errores'
import { formatoFecha } from '../lib/formato'
import { ApiError } from '../lib/http'
import { RUTAS } from '../lib/rutas'
import {
  clavesEventos,
  useArtistasActivos,
  useAsociarArtista,
  useCrearEvento,
  useEvento,
  usePublicarEvento,
  useSedesActivas,
} from '../features/eventos/api'
import {
  eventosCreadosEnSesion,
  recordarEventoCreado,
} from '../features/eventos/creadosEnSesion'
import { useQueryClient } from '@tanstack/react-query'

export function AdminEventos() {
  const [codigo, setCodigo] = useState('')
  const [buscado, setBuscado] = useState('')
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const evento = useEvento(buscado)
  const creados = eventosCreadosEnSesion()
  const navigate = useNavigate()

  const buscar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = z.string().trim().min(1).safeParse(codigo)
    if (parsed.success) {
      setErrorBusqueda('')
      setBuscado(parsed.data)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header>
          <p className="text-sm font-bold uppercase tracking-widest text-acento-500">Administración</p>
          <h1 className="mt-1 text-3xl font-extrabold">Eventos</h1>
        </header>
        <Link className="inline-flex min-h-11 items-center rounded-xl bg-marca-600 px-4 font-semibold text-white hover:bg-marca-700" to={RUTAS.nuevoEvento}>+ Nuevo evento</Link>
      </div>
      <Tarjeta>
        <h2 className="text-lg font-bold">Buscar evento por código</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={buscar}>
          <Campo etiqueta="Código del evento" value={codigo} onChange={(event) => setCodigo(event.target.value)} />
          <Boton className="self-end" type="submit">Abrir</Boton>
        </form>
        {errorBusqueda && <p className="mt-3 text-sm text-red-600" role="alert">{errorBusqueda}</p>}
        {buscado && (evento.isPending ? <Cargando mensaje="Buscando…" /> : evento.isError ? (
          <Aviso>{esNoEncontrado(evento.error) ? 'Evento no disponible.' : mensajeError(evento.error)}</Aviso>
        ) : evento.data ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
            <span><strong>{evento.data.eventCode}</strong> · {evento.data.name}</span>
            <Boton onClick={() => navigate(RUTAS.gestionarEvento(evento.data.eventCode))}>Gestionar</Boton>
          </div>
        ) : null)}
      </Tarjeta>
      <section>
        <h2 className="mb-3 text-xl font-bold">Creados en esta sesión</h2>
        {creados.length === 0 ? (
          <EstadoVacio titulo="Aún no has creado eventos" mensaje="Los eventos que crees aquí aparecerán durante esta sesión." />
        ) : (
          <div className="grid gap-3">
            {creados.map((item) => (
              <Tarjeta className="flex flex-wrap items-center justify-between gap-3" key={item.eventCode}>
                <p><strong>{item.eventCode}</strong> · {item.name}</p>
                <div className="flex items-center gap-3"><Badge estado={item.status} /><Link className="font-semibold text-marca-700 hover:underline dark:text-indigo-300" to={RUTAS.gestionarEvento(item.eventCode)}>Gestionar</Link></div>
              </Tarjeta>
            ))}
          </div>
        )}
        <p className="mt-3 text-sm text-slate-500">La API no ofrece un listado completo de eventos; puedes abrir uno por su código.</p>
      </section>
    </div>
  )
}

const CrearEventoSchema = z.object({
  eventCode: z.string().trim().min(1, 'Ingresa un código de evento.'),
  name: z.string().trim().min(1, 'Ingresa el nombre del evento.'),
  description: z.string().max(500, 'La descripción no puede superar 500 caracteres.'),
  category: CategoriaSchema,
  eventDate: z.string().min(1, 'Selecciona la fecha y hora.'),
  minimumAge: z.number({ error: 'Ingresa una edad válida.' }).int('Ingresa una edad entera.').min(0, 'La edad no puede ser negativa.'),
  venueCode: z.string().min(1, 'Selecciona una sede.'),
})
type CrearEventoValues = z.infer<typeof CrearEventoSchema>

export function AdminCrearEvento() {
  const sedes = useSedesActivas()
  const crear = useCrearEvento()
  const navigate = useNavigate()
  const [errorApi, setErrorApi] = useState('')
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<CrearEventoValues>({
    resolver: zodResolver(CrearEventoSchema),
    defaultValues: { description: '', category: 'MUSIC', minimumAge: 0 },
  })

  const enviar = handleSubmit(async (values) => {
    setErrorApi('')
    try {
      const event = await crear.mutateAsync(values)
      recordarEventoCreado(event)
      navigate(RUTAS.gestionarEvento(event.eventCode), {
        state: { mensaje: 'Evento creado. Puedes publicarlo y asociar artistas.' },
      })
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 400 && Object.keys(error.details).length > 0) {
        const nombresCampos = new Set(['eventCode', 'name', 'description', 'category', 'eventDate', 'minimumAge', 'venueCode'])
        let mapeados = false
        for (const [campo, mensaje] of Object.entries(error.details)) {
          if (nombresCampos.has(campo)) {
            setError(campo as keyof CrearEventoValues, { type: 'server', message: mensaje })
            mapeados = true
          }
        }
        setErrorApi(mapeados ? '' : mensajeError(error, 'No pudimos crear el evento.'))
      } else {
        setErrorApi(mensajeError(error, 'No pudimos crear el evento.'))
      }
    }
  })

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to={RUTAS.adminEventos} className="inline-flex min-h-11 items-center font-semibold text-marca-700 hover:underline dark:text-indigo-300">← Eventos</Link>
      <Tarjeta className="p-6 sm:p-9">
        <p className="text-sm font-bold uppercase tracking-widest text-acento-500">Administración</p>
        <h1 className="mt-1 text-3xl font-extrabold">Nuevo evento</h1>
        {errorApi && <div className="mt-5"><Aviso>{errorApi}</Aviso></div>}
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void enviar(event)}>
          <Campo etiqueta="Código del evento" placeholder="CMF-2026" {...register('eventCode')} error={errors.eventCode?.message} />
          <Campo etiqueta="Nombre" {...register('name')} error={errors.name?.message} />
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2 dark:text-slate-200" htmlFor="description">
            Descripción
            <textarea id="description" rows={4} maxLength={500} className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base font-normal focus:border-marca-600 focus:outline-none focus:ring-2 focus:ring-marca-500/25 dark:border-slate-700 dark:bg-slate-900" {...register('description')} />
            <span className="text-right text-xs font-normal text-slate-500">Máximo 500 caracteres</span>
            {errors.description?.message && <span className="text-sm font-normal text-red-600">{errors.description.message}</span>}
          </label>
          <Selector etiqueta="Categoría" {...register('category')} error={errors.category?.message}>
            {Object.entries(CATEGORIAS).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </Selector>
          <Campo etiqueta="Edad mínima" type="number" min={0} {...register('minimumAge', { valueAsNumber: true })} error={errors.minimumAge?.message} />
          <Campo etiqueta="Fecha y hora" type="datetime-local" {...register('eventDate')} error={errors.eventDate?.message} />
          <Selector etiqueta="Sede" {...register('venueCode')} error={errors.venueCode?.message}>
            <option value="">Selecciona una sede</option>
            {sedes.data?.map((venue) => <option key={venue.code} value={venue.code}>{venue.name} ({venue.code})</option>)}
          </Selector>
          {sedes.isError && <p className="text-sm text-red-600 sm:col-span-2">{mensajeError(sedes.error, 'No fue posible cargar las sedes.')}</p>}
          <div className="flex flex-wrap justify-end gap-3 pt-2 sm:col-span-2">
            <Link className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" to={RUTAS.adminEventos}>Cancelar</Link>
            <Boton type="submit" cargando={isSubmitting || crear.isPending}>Crear evento</Boton>
          </div>
        </form>
      </Tarjeta>
    </div>
  )
}

const AvisoRutaSchema = z.object({ mensaje: z.string().optional() })

export function AdminGestionEvento() {
  const { eventCode = '' } = useParams()
  const evento = useEvento(eventCode)
  const artistas = useArtistasActivos()
  const publicar = usePublicarEvento()
  const asociar = useAsociarArtista()
  const queryClient = useQueryClient()
  const [artistaId, setArtistaId] = useState('')
  const [modalPublicar, setModalPublicar] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')

  const location = useLocation()
  const aviso = AvisoRutaSchema.safeParse(location.state)
  const confirmarPublicacion = async () => {
    setErrorAccion('')
    try {
      const updated = await publicar.mutateAsync(eventCode)
      recordarEventoCreado(updated)
      setModalPublicar(false)
    } catch (error: unknown) {
      setErrorAccion(mensajeError(error, 'No fue posible publicar el evento.'))
    }
  }
  const agregarArtista = async () => {
    const selected = artistas.data?.find((item) => String(item.id) === artistaId)
    if (!selected) return
    setErrorAccion('')
    try {
      const updated = await asociar.mutateAsync({ eventCode, artistId: selected.id })
      recordarEventoCreado(updated)
      setArtistaId('')
      await queryClient.invalidateQueries({ queryKey: clavesEventos.detalle(eventCode) })
    } catch (error: unknown) {
      setErrorAccion(mensajeError(error, 'No fue posible asociar el artista.'))
    }
  }

  if (evento.isPending) return <Cargando />
  if (evento.isError && esNoEncontrado(evento.error)) {
    return <EstadoVacio titulo="Evento no disponible" mensaje="No encontramos un evento accesible con ese código." />
  }
  if (evento.isError || !evento.data) {
    return <EstadoError mensaje={mensajeError(evento.error)} onReintentar={() => void evento.refetch()} />
  }

  const data = evento.data
  const sede = data.sede ?? data.venue
  const asociados = data.artists ?? []
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to={RUTAS.adminEventos} className="inline-flex min-h-11 items-center font-semibold text-marca-700 hover:underline dark:text-indigo-300">← Eventos</Link>
      {aviso.success && aviso.data.mensaje && <Aviso tipo="exito">{aviso.data.mensaje}</Aviso>}
      <Tarjeta>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-sm text-slate-500">{data.eventCode}</p>
            <h1 className="mt-1 text-3xl font-extrabold">{data.name}</h1>
          </div>
          <Badge estado={data.status} />
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-300">{CATEGORIAS[data.category]} · {formatoFecha(data.eventDate)} · Mín. {data.minimumAge ?? 0} años</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300">{sede?.name ?? data.venueName ?? data.venueCode ?? 'Sede no disponible'}</p>
      </Tarjeta>
      <Tarjeta>
        <h2 className="text-xl font-bold">Publicación</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">El evento será visible en la cartelera una vez publicado.</p>
        {data.status === 'DRAFT' ? (
          <Boton className="mt-4" onClick={() => setModalPublicar(true)}>Publicar evento</Boton>
        ) : <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">El evento ya está publicado o no puede publicarse desde su estado actual.</p>}
      </Tarjeta>
      <Tarjeta>
        <h2 className="text-xl font-bold">Artistas asociados</h2>
        {asociados.length ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {asociados.map((artist) => <li className="rounded-xl bg-slate-50 px-4 py-3 font-semibold dark:bg-slate-800" key={artist.id}>{artist.stageName}</li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Aún no hay artistas asociados.</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Selector etiqueta="Agregar artista" value={artistaId} onChange={(event) => setArtistaId(event.target.value)}>
            <option value="">Selecciona un artista</option>
            {artistas.data?.filter((item) => !asociados.some((associated) => String(associated.id) === String(item.id))).map((artist) => (
              <option key={artist.id} value={artist.id}>{artist.stageName}</option>
            ))}
          </Selector>
          <Boton className="self-end" disabled={!artistaId} cargando={asociar.isPending} onClick={() => void agregarArtista()}>Asociar artista</Boton>
        </div>
        {artistas.isError && <p className="mt-3 text-sm text-red-600">{mensajeError(artistas.error)}</p>}
      </Tarjeta>
      {errorAccion && <Aviso>{errorAccion}</Aviso>}
      <Link className="inline-flex min-h-11 items-center font-semibold text-marca-700 hover:underline dark:text-indigo-300" to={RUTAS.ticketsEvento(eventCode)}>Ver tickets pagados →</Link>
      <Modal abierto={modalPublicar} titulo="Publicar evento" onCerrar={() => setModalPublicar(false)}>
        <p className="text-slate-600 dark:text-slate-300">¿Confirmas que quieres hacer visible este evento en la cartelera?</p>
        <div className="mt-5 flex justify-end gap-3">
          <Boton variante="secundario" onClick={() => setModalPublicar(false)}>Volver</Boton>
          <Boton cargando={publicar.isPending} onClick={() => void confirmarPublicacion()}>Confirmar publicación</Boton>
        </div>
      </Modal>
    </div>
  )
}
