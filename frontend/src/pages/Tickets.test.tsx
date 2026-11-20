import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { DetalleTicket, MisTickets } from './Tickets'
import {
  API,
  errorRespuesta,
  ticketPagado,
  ticketUsado,
} from '../test/handlers'
import { server } from '../test/server'
import { autenticar, renderConProveedores } from '../test/utils'

describe('mis tickets', () => {
  it('lista los tickets del usuario e invita a cancelar solo los pagados', async () => {
    autenticar('USER')
    server.use(
      http.get(`${API}/tickets/by-user`, () =>
        HttpResponse.json([ticketPagado, ticketUsado]),
      ),
    )
    renderConProveedores([{ path: '/mis-tickets', element: <MisTickets /> }], {
      initialEntries: ['/mis-tickets'],
    })

    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Neon Night' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Cancelar' })).toHaveLength(1)
  })

  it('filtra por estado usando la URL', async () => {
    const user = userEvent.setup()
    autenticar('USER')
    server.use(
      http.get(`${API}/tickets/by-user`, () =>
        HttpResponse.json([ticketPagado, ticketUsado]),
      ),
    )
    const { router } = renderConProveedores(
      [{ path: '/mis-tickets', element: <MisTickets /> }],
      { initialEntries: ['/mis-tickets'] },
    )

    await screen.findByRole('heading', { name: 'Neon Night' })
    await user.selectOptions(screen.getByLabelText('Filtrar por estado'), 'PAID')

    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Neon Night' })).not.toBeInTheDocument(),
    )
    expect(router.state.location.search).toContain('estado=PAID')
  })

  it('muestra el estado vacío cuando no hay tickets', async () => {
    autenticar('USER')
    server.use(
      http.get(`${API}/tickets/by-user`, () => HttpResponse.json([])),
    )
    renderConProveedores([{ path: '/mis-tickets', element: <MisTickets /> }], {
      initialEntries: ['/mis-tickets'],
    })

    expect(await screen.findByText('Aún no tienes tickets')).toBeInTheDocument()
  })

  it('cancela un ticket PAID y actualiza la lista', async () => {
    const user = userEvent.setup()
    autenticar('USER')
    let cancelado = false
    server.use(
      http.get(`${API}/tickets/by-user`, () =>
        HttpResponse.json([
          { ...ticketPagado, status: cancelado ? 'CANCELLED' : 'PAID' },
        ]),
      ),
      http.patch(`${API}/tickets/TKT-ANDREA/cancel`, () => {
        cancelado = true
        return HttpResponse.json({ ...ticketPagado, status: 'CANCELLED' })
      }),
    )
    renderConProveedores([{ path: '/mis-tickets', element: <MisTickets /> }], {
      initialEntries: ['/mis-tickets'],
    })

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }))

    expect(await screen.findByText('Cancelado')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('mantiene el modal y muestra el mensaje cuando la cancelación responde 409', async () => {
    const user = userEvent.setup()
    autenticar('USER')
    server.use(
      http.get(`${API}/tickets/by-user`, () =>
        HttpResponse.json([ticketPagado]),
      ),
      http.patch(`${API}/tickets/TKT-ANDREA/cancel`, () =>
        errorRespuesta(409, 'El ticket ya fue utilizado.'),
      ),
    )
    renderConProveedores([{ path: '/mis-tickets', element: <MisTickets /> }], {
      initialEntries: ['/mis-tickets'],
    })

    await user.click(await screen.findByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar cancelación' }))

    expect(await screen.findByText('El ticket ya fue utilizado.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('detalle de ticket', () => {
  it('oculta la cancelación cuando el ticket no está PAID', async () => {
    autenticar('USER')
    server.use(
      http.get(`${API}/tickets/TKT-USADO`, () => HttpResponse.json(ticketUsado)),
    )
    renderConProveedores(
      [{ path: '/mis-tickets/:ticketCode', element: <DetalleTicket /> }],
      { initialEntries: ['/mis-tickets/TKT-USADO'] },
    )

    expect(await screen.findByText('TKT-USADO')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar ticket' })).not.toBeInTheDocument()
  })

  it('muestra "Ticket no disponible" ante un ticket ajeno (403)', async () => {
    autenticar('USER')
    server.use(
      http.get(`${API}/tickets/TKT-CARLOS`, () =>
        errorRespuesta(403, 'No autorizado'),
      ),
    )
    renderConProveedores(
      [{ path: '/mis-tickets/:ticketCode', element: <DetalleTicket /> }],
      { initialEntries: ['/mis-tickets/TKT-CARLOS'] },
    )

    expect(await screen.findByText('Ticket no disponible')).toBeInTheDocument()
  })
})
