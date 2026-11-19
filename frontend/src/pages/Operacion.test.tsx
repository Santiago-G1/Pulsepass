import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { TicketsPagadosEvento, ValidacionIngreso } from './Operacion'
import {
  API,
  errorRespuesta,
  ticketPagado,
  ticketUsado,
} from '../test/handlers'
import { server } from '../test/server'
import { autenticar, renderConProveedores } from '../test/utils'

describe('validación de ingreso', () => {
  it('busca un ticket y lo marca como usado', async () => {
    const user = userEvent.setup()
    autenticar('STAFF')
    let usado = false
    server.use(
      http.get(`${API}/tickets/TKT-ANDREA`, () =>
        HttpResponse.json(usado ? ticketUsado : ticketPagado),
      ),
      http.patch(`${API}/tickets/TKT-ANDREA/use`, () => {
        usado = true
        return HttpResponse.json(ticketUsado)
      }),
    )
    renderConProveedores(
      [{ path: '/staff/validacion', element: <ValidacionIngreso /> }],
      { initialEntries: ['/staff/validacion'] },
    )

    await user.type(await screen.findByLabelText('Código de ticket'), 'TKT-ANDREA')
    await user.click(screen.getByRole('button', { name: 'Buscar ticket' }))
    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Marcar como usado' }))
    expect(
      await screen.findByText('Ingreso registrado correctamente.'),
    ).toBeInTheDocument()
  })

  it('muestra el 409 cuando el ticket ya fue usado', async () => {
    const user = userEvent.setup()
    autenticar('STAFF')
    server.use(
      http.get(`${API}/tickets/TKT-ANDREA`, () => HttpResponse.json(ticketPagado)),
      http.patch(`${API}/tickets/TKT-ANDREA/use`, () =>
        errorRespuesta(409, 'El ticket ya fue utilizado.'),
      ),
    )
    renderConProveedores(
      [{ path: '/staff/validacion', element: <ValidacionIngreso /> }],
      { initialEntries: ['/staff/validacion'] },
    )

    await user.type(await screen.findByLabelText('Código de ticket'), 'TKT-ANDREA')
    await user.click(screen.getByRole('button', { name: 'Buscar ticket' }))
    await user.click(await screen.findByRole('button', { name: 'Marcar como usado' }))

    expect(await screen.findByText('El ticket ya fue utilizado.')).toBeInTheDocument()
  })

  it('muestra "Ticket no encontrado" ante un 404', async () => {
    const user = userEvent.setup()
    autenticar('STAFF')
    server.use(
      http.get(`${API}/tickets/TKT-NO-EXISTE`, () =>
        errorRespuesta(404, 'Ticket no encontrado'),
      ),
    )
    renderConProveedores(
      [{ path: '/staff/validacion', element: <ValidacionIngreso /> }],
      { initialEntries: ['/staff/validacion'] },
    )

    await user.type(await screen.findByLabelText('Código de ticket'), 'TKT-NO-EXISTE')
    await user.click(screen.getByRole('button', { name: 'Buscar ticket' }))

    expect(await screen.findByText('Ticket no encontrado.')).toBeInTheDocument()
  })
})

describe('tickets pagados por evento', () => {
  it('lista los tickets PAID del evento en tabla', async () => {
    autenticar('STAFF')
    server.use(
      http.get(`${API}/events/CMF-2026/tickets/paid`, () =>
        HttpResponse.json([ticketPagado]),
      ),
    )
    renderConProveedores(
      [{ path: '/staff/eventos/:eventCode/tickets', element: <TicketsPagadosEvento /> }],
      { initialEntries: ['/staff/eventos/CMF-2026/tickets'] },
    )

    expect(await screen.findByRole('heading', { name: 'Tickets pagados · CMF-2026' })).toBeInTheDocument()
    expect((await screen.findAllByText('TKT-ANDREA')).length).toBeGreaterThan(0)
    expect(screen.getByText('Total: 1')).toBeInTheDocument()
  })
})
