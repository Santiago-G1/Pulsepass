import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../auth/contexto'
import {
  Aviso,
  Badge,
  Boton,
  Cargando,
  EstadoError,
  EstadoVacio,
  Modal,
  Selector,
  Tarjeta,
} from '../componentes/ui'
import { useUsuarioPorEmail, useUsuarioPorUsername } from '../features/usuarios/api'
import { useCancelarTicket, useMisTickets, useTicket } from '../features/tickets/api'
import type { EstadoTicket } from '../lib/contratos'
import { esNoEncontrado, mensajeError } from '../lib/errores'
import { formatoCOP, formatoFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'

const estadosTicket: { valor: EstadoTicket | ''; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos los estados' },
  { valor: 'PAID', etiqueta: 'Pagados' },
  { valor: 'RESERVED', etiqueta: 'Reservados' },
  { valor: 'USED', etiqueta: 'Usados' },
  { valor: 'CANCELLED', etiqueta: 'Cancelados' },
]

export function Cuenta() {
  const { sesion } = useAuth()
  const usuario = sesion.estado === 'autenticado' ? sesion.usuario : undefined
  const porEmail = useUsuarioPorEmail(usuario?.email ?? '')
  const porUsername = useUsuarioPorUsername(usuario?.username ?? '')
  const detalle = porEmail.data ?? porUsername.data

  if (!usuario) return <Cargando />
  if (porEmail.isPending || porUsername.isPending) return <Cargando />
  const error = porEmail.error ?? porUsername.error
  if (error && !detalle) {
    return <EstadoError mensaje={mensajeError(error)} onReintentar={() => {
      void porEmail.refetch()
      void porUsername.refetch()
    }} />
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-marca-600">Tu perfil</p>
        <h1 className="mt-1 text-3xl font-extrabold">Mi cuenta</h1>
      </header>
      <Tarjeta>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><p className="text-sm text-slate-500">Nombre</p><p className="mt-1 font-semibold">{detalle?.firstName ?? usuario.firstName ?? usuario.username} {detalle?.lastName ?? usuario.lastName ?? ''}</p></div>
          <div><p className="text-sm text-slate-500">Usuario</p><p className="mt-1 font-semibold">{detalle?.username ?? usuario.username}</p></div>
          <div><p className="text-sm text-slate-500">Correo</p><p className="mt-1 font-semibold">{detalle?.email ?? usuario.email}</p></div>
          <div><p className="text-sm text-slate-500">Fecha de nacimiento</p><p className="mt-1 font-semibold">{detalle?.birthDate ?? 'No registrada'}</p></div>
          <div><p className="text-sm text-slate-500">Rol</p><p className="mt-1 font-semibold">{usuario.roles.join(', ')}</p></div>
        </div>
      </Tarjeta>
      {error && <Aviso tipo="info">Algunos datos del perfil no están disponibles en este momento.</Aviso>}
      <Link to={RUTAS.misTickets} className="inline-flex min-h-11 items-center font-semibold text-marca-700 hover:underline dark:text-indigo-300">Ver mis tickets →</Link>
    </div>
  )
}

export function MisTickets() {
  const { sesion } = useAuth()
  const [params, setParams] = useSearchParams()
  const estado = (params.get('estado') ?? '') as EstadoTicket | ''
  const email = sesion.estado === 'autenticado' ? sesion.usuario.email : ''
  const tickets = useMisTickets(email)
  const cancelar = useCancelarTicket()
  const [ticketSeleccionado, setTicketSeleccionado] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

  const filtrar = tickets.data?.filter((ticket) => !estado || ticket.status === estado) ?? []
  const cerrarModal = () => {
    setTicketSeleccionado('')
    setErrorAccion('')
  }
  const confirmarCancelacion = async () => {
    setErrorAccion('')
    try {
      await cancelar.mutateAsync(ticketSeleccionado)
      cerrarModal()
    } catch (error: unknown) {
      setErrorAccion(mensajeError(error, 'No pudimos cancelar el ticket.'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <header>
          <p className="text-sm font-bold uppercase tracking-widest text-marca-600">Tus experiencias</p>
          <h1 className="mt-1 text-3xl font-extrabold">Mis tickets</h1>
        </header>
        <div className="w-full sm:max-w-xs">
          <Selector etiqueta="Filtrar por estado" name="estado-ticket" value={estado} onChange={(event) => {
            const next = new URLSearchParams(params)
            if (event.target.value) next.set('estado', event.target.value)
            else next.delete('estado')
            setParams(next, { replace: true })
          }}>
            {estadosTicket.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
          </Selector>
        </div>
      </div>
      {tickets.isPending ? <Cargando /> : tickets.isError ? (
        <EstadoError mensaje={mensajeError(tickets.error)} onReintentar={() => void tickets.refetch()} />
      ) : filtrar.length === 0 ? (
        <EstadoVacio
          titulo={tickets.data.length ? 'No hay tickets con este estado' : 'Aún no tienes tickets'}
          mensaje={tickets.data.length ? 'Prueba otro filtro.' : 'Cuando compres una entrada, aparecerá aquí.'}
        />
      ) : (
        <div className="grid gap-4">
          {filtrar.map((ticket) => {
            const evento = ticket.evento ?? ticket.event
            return (
              <Tarjeta className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" key={ticket.ticketCode}>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-bold">{evento?.name ?? ticket.ticketCode}</h2>
                    <Badge estado={ticket.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{ticket.type} · {formatoCOP(ticket.price)}</p>
                  {ticket.purchaseDate && <p className="mt-1 text-sm text-slate-500">Comprado el {formatoFecha(ticket.purchaseDate)}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800" to={RUTAS.ticket(ticket.ticketCode)}>Ver ticket</Link>
                  {ticket.status === 'PAID' && (
                    <Boton variante="peligro" onClick={() => setTicketSeleccionado(ticket.ticketCode)}>Cancelar</Boton>
                  )}
                </div>
              </Tarjeta>
            )
          })}
        </div>
      )}
      <Modal abierto={Boolean(ticketSeleccionado)} titulo="Cancelar ticket" onCerrar={cerrarModal}>
        <p className="text-slate-600 dark:text-slate-300">¿Confirmas que quieres cancelar esta entrada? La solicitud será validada por el servidor.</p>
        {errorAccion && <div className="mt-4"><Aviso>{errorAccion}</Aviso></div>}
        <div className="mt-5 flex justify-end gap-3">
          <Boton variante="secundario" onClick={cerrarModal}>Volver</Boton>
          <Boton variante="peligro" cargando={cancelar.isPending} onClick={() => void confirmarCancelacion()}>Confirmar cancelación</Boton>
        </div>
      </Modal>
    </div>
  )
}

function DetalleTicketContenido({ code, confirmacion = false }: { code: string; confirmacion?: boolean }) {
  const ticket = useTicket(code)
  const cancelar = useCancelarTicket()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [errorAccion, setErrorAccion] = useState('')

  if (ticket.isPending) return <Cargando />
  if (ticket.isError && esNoEncontrado(ticket.error)) {
    return <EstadoVacio titulo="Ticket no disponible" mensaje="Este ticket no está disponible o no tienes acceso a él." />
  }
  if (ticket.isError || !ticket.data) {
    return <EstadoError mensaje={mensajeError(ticket.error)} onReintentar={() => void ticket.refetch()} />
  }

  const data = ticket.data
  const evento = data.evento ?? data.event
  const usuario = data.usuario ?? data.user
  const cerrarModal = () => {
    setModalAbierto(false)
    setErrorAccion('')
  }
  const confirmar = async () => {
    setErrorAccion('')
    try {
      await cancelar.mutateAsync(code)
      cerrarModal()
    } catch (error: unknown) {
      setErrorAccion(mensajeError(error, 'No pudimos cancelar el ticket.'))
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {confirmacion && (
        <Aviso tipo="exito">¡Compra confirmada! Guarda el código de tu ticket para presentarlo en el evento.</Aviso>
      )}
      <Tarjeta className="overflow-hidden p-0">
        <div className="bg-gradient-to-r from-indigo-800 to-marca-600 p-6 text-white sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-100">{confirmacion ? 'Entrada confirmada' : 'Tu entrada PulsePass'}</p>
          <h1 className="mt-2 text-3xl font-extrabold">{evento?.name ?? 'Ticket'}</h1>
          <p className="mt-2 text-indigo-100">{evento?.eventDate ? formatoFecha(evento.eventDate) : 'Fecha por confirmar'}</p>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
          <div><p className="text-sm text-slate-500">Código del ticket</p><p className="mt-1 break-all font-mono text-lg font-bold">{data.ticketCode}</p></div>
          <div><p className="text-sm text-slate-500">Estado</p><div className="mt-2"><Badge estado={data.status} /></div></div>
          <div><p className="text-sm text-slate-500">Tipo de entrada</p><p className="mt-1 font-semibold">{data.type}</p></div>
          <div><p className="text-sm text-slate-500">Precio confirmado</p><p className="mt-1 font-semibold">{formatoCOP(data.price)}</p></div>
          <div><p className="text-sm text-slate-500">Titular</p><p className="mt-1 font-semibold">{usuario ? `${usuario.firstName} ${usuario.lastName}` : 'Cuenta PulsePass'}</p></div>
          {data.purchaseDate && <div><p className="text-sm text-slate-500">Fecha de compra</p><p className="mt-1 font-semibold">{formatoFecha(data.purchaseDate)}</p></div>}
        </div>
      </Tarjeta>
      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 items-center rounded-xl bg-marca-600 px-4 font-semibold text-white hover:bg-marca-700" to={RUTAS.misTickets}>Mis tickets</Link>
        {data.status === 'PAID' && (
          <Boton variante="peligro" onClick={() => setModalAbierto(true)}>Cancelar ticket</Boton>
        )}
      </div>
      <Modal abierto={modalAbierto} titulo="Cancelar ticket" onCerrar={cerrarModal}>
        <p className="text-slate-600 dark:text-slate-300">¿Confirmas la cancelación? El servidor validará las reglas aplicables.</p>
        {errorAccion && <div className="mt-4"><Aviso>{errorAccion}</Aviso></div>}
        <div className="mt-5 flex justify-end gap-3">
          <Boton variante="secundario" onClick={cerrarModal}>Volver</Boton>
          <Boton variante="peligro" cargando={cancelar.isPending} onClick={() => void confirmar()}>Confirmar</Boton>
        </div>
      </Modal>
    </div>
  )
}

export function DetalleTicket() {
  const { ticketCode = '' } = useParams()
  return <DetalleTicketContenido code={ticketCode} />
}

export function ConfirmacionCompra() {
  const { ticketCode = '' } = useParams()
  const navigate = useNavigate()
  return (
    <div className="space-y-5">
      <DetalleTicketContenido code={ticketCode} confirmacion />
      <button className="font-semibold text-marca-700 hover:underline dark:text-indigo-300" onClick={() => navigate(RUTAS.eventos)} type="button">Seguir explorando eventos</button>
    </div>
  )
}
