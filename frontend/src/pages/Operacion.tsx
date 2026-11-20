import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import {
  Aviso,
  Badge,
  Boton,
  Cargando,
  Campo,
  EstadoError,
  EstadoVacio,
  Tarjeta,
} from '../componentes/ui'
import { useTicketsPagados, useTicket, useUsarTicket } from '../features/tickets/api'
import { esNoEncontrado, mensajeError } from '../lib/errores'
import { formatoCOP, formatoFecha } from '../lib/formato'
import { RUTAS } from '../lib/rutas'

export function ValidacionIngreso() {
  const [valor, setValor] = useState('')
  const [codigoBuscado, setCodigoBuscado] = useState('')
  const [resultadoAccion, setResultadoAccion] = useState('')
  const ticket = useTicket(codigoBuscado)
  const usar = useUsarTicket()

  const buscar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = z.string().trim().min(1).safeParse(valor)
    if (parsed.success) {
      setResultadoAccion('')
      setCodigoBuscado(parsed.data)
    }
  }
  const marcarUsado = async () => {
    try {
      await usar.mutateAsync(codigoBuscado)
      setResultadoAccion('Ingreso registrado correctamente.')
      setValor('')
    } catch (error: unknown) {
      setResultadoAccion(mensajeError(error, 'No fue posible validar este ticket.'))
    }
  }

  const data = ticket.data
  const evento = data?.evento ?? data?.event
  const usuario = data?.usuario ?? data?.user
  const resultadoEsError = resultadoAccion && usar.isError

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-acento-500">Operación en puerta</p>
        <h1 className="mt-1 text-3xl font-extrabold">Validación de ingreso</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Busca el código de la entrada para verificar su estado.</p>
      </header>
      <Tarjeta>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={buscar}>
          <Campo
            autoFocus
            etiqueta="Código de ticket"
            name="ticketCode"
            placeholder="Ej. TKT-8F2A1C"
            value={valor}
            onChange={(event) => setValor(event.target.value)}
          />
          <Boton className="self-end" type="submit">Buscar ticket</Boton>
        </form>
      </Tarjeta>
      {ticket.isPending && codigoBuscado && <Cargando mensaje="Buscando ticket…" />}
      {ticket.isError && codigoBuscado && (
        <EstadoError
          mensaje={esNoEncontrado(ticket.error) ? 'Ticket no encontrado.' : mensajeError(ticket.error)}
          onReintentar={() => void ticket.refetch()}
        />
      )}
      {data && (
        <Tarjeta className="border-2 border-indigo-200 p-6 dark:border-indigo-900 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">{data.ticketCode}</p>
              <h2 className="mt-1 text-2xl font-extrabold">{evento?.name ?? 'Ticket PulsePass'}</h2>
            </div>
            <Badge estado={data.status} />
          </div>
          <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
            <p><span className="text-sm text-slate-500">Tipo</span><br /><strong>{data.type}</strong></p>
            <p><span className="text-sm text-slate-500">Titular</span><br /><strong>{usuario ? `${usuario.firstName} ${usuario.lastName}` : 'No disponible'}</strong></p>
            <p><span className="text-sm text-slate-500">Precio</span><br /><strong>{formatoCOP(data.price)}</strong></p>
            <p><span className="text-sm text-slate-500">Fecha del evento</span><br /><strong>{evento?.eventDate ? formatoFecha(evento.eventDate) : 'Por confirmar'}</strong></p>
          </div>
          {resultadoAccion && <div className="mt-5"><Aviso tipo={resultadoEsError ? 'error' : 'exito'}>{resultadoAccion}</Aviso></div>}
          {data.status === 'PAID' && (
            <Boton className="mt-6 min-h-12 w-full sm:w-auto" cargando={usar.isPending} onClick={() => void marcarUsado()}>
              Marcar como usado
            </Boton>
          )}
        </Tarjeta>
      )}
    </div>
  )
}

export function TicketsPagadosEvento() {
  const { eventCode = '' } = useParams()
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState(eventCode)
  const [resultado, setResultado] = useState('')
  const tickets = useTicketsPagados(eventCode)
  const usar = useUsarTicket()

  const abrirEvento = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = z.string().trim().min(1).safeParse(codigo)
    if (parsed.success) navigate(RUTAS.ticketsEvento(parsed.data))
  }
  const marcar = async (ticketCode: string) => {
    setResultado('')
    try {
      await usar.mutateAsync(ticketCode)
      setResultado(`El ticket ${ticketCode} fue marcado como usado.`)
    } catch (error: unknown) {
      setResultado(mensajeError(error, 'No fue posible validar el ticket.'))
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-acento-500">Operación</p>
        <h1 className="mt-1 text-3xl font-extrabold">Tickets pagados · {eventCode}</h1>
      </header>
      <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={abrirEvento}>
        <Campo etiqueta="Código del evento" value={codigo} onChange={(event) => setCodigo(event.target.value)} />
        <Boton className="self-end" type="submit">Abrir evento</Boton>
      </form>
      {resultado && <Aviso tipo={usar.isError ? 'error' : 'exito'}>{resultado}</Aviso>}
      {tickets.isPending ? <Cargando /> : tickets.isError && esNoEncontrado(tickets.error) ? (
        <EstadoVacio titulo="Evento no disponible" mensaje="No encontramos tickets para ese evento." />
      ) : tickets.isError ? (
        <EstadoError mensaje={mensajeError(tickets.error)} onReintentar={() => void tickets.refetch()} />
      ) : tickets.data.length === 0 ? (
        <EstadoVacio titulo="No hay tickets pagados" mensaje="Cuando existan entradas pagadas aparecerán en esta lista." />
      ) : (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total: {tickets.data.length}</p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>{['Código', 'Tipo', 'Titular', 'Precio', 'Estado', 'Acción'].map((head) => <th className="px-4 py-3 font-semibold" key={head}>{head}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {tickets.data.map((ticket) => {
                    const owner = ticket.usuario ?? ticket.user
                    return (
                      <tr key={ticket.ticketCode}>
                        <td className="px-4 py-3 font-mono">{ticket.ticketCode}</td>
                        <td className="px-4 py-3">{ticket.type}</td>
                        <td className="px-4 py-3">{owner ? `${owner.firstName} ${owner.lastName}` : '—'}</td>
                        <td className="px-4 py-3">{formatoCOP(ticket.price)}</td>
                        <td className="px-4 py-3"><Badge estado={ticket.status} /></td>
                        <td className="px-4 py-3">{ticket.status === 'PAID' && <Boton onClick={() => void marcar(ticket.ticketCode)}>Usar</Boton>}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-3 md:hidden">
              {tickets.data.map((ticket) => {
                const owner = ticket.usuario ?? ticket.user
                return (
                  <Tarjeta className="space-y-3" key={ticket.ticketCode}>
                    <div className="flex items-start justify-between gap-3"><p className="font-mono font-bold">{ticket.ticketCode}</p><Badge estado={ticket.status} /></div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.type} · {owner ? `${owner.firstName} ${owner.lastName}` : 'Titular no disponible'}</p>
                    <p className="font-semibold">{formatoCOP(ticket.price)}</p>
                    {ticket.status === 'PAID' && <Boton className="w-full" onClick={() => void marcar(ticket.ticketCode)}>Marcar como usado</Boton>}
                  </Tarjeta>
                )
              })}
            </div>
          </div>
        </>
      )}
      <Link to={RUTAS.validacionStaff} className="inline-flex min-h-11 items-center font-semibold text-marca-700 hover:underline dark:text-indigo-300">Validar un ticket →</Link>
    </div>
  )
}
