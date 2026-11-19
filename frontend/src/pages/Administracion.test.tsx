import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { AdminCrearEvento, AdminGestionEvento } from './Administracion'
import {
  API,
  artistas,
  errorRespuesta,
  eventoBorrador,
  eventoPublicado,
} from '../test/handlers'
import { server } from '../test/server'
import { autenticar, renderConProveedores } from '../test/utils'

describe('crear evento', () => {
  it('no llama a la API con campos obligatorios vacíos', async () => {
    const user = userEvent.setup()
    autenticar('ADMIN')
    let peticiones = 0
    server.use(
      http.post(`${API}/events`, () => {
        peticiones += 1
        return HttpResponse.json(eventoPublicado, { status: 201 })
      }),
    )
    renderConProveedores(
      [{ path: '/admin/eventos/nuevo', element: <AdminCrearEvento /> }],
      { initialEntries: ['/admin/eventos/nuevo'] },
    )

    await user.click(await screen.findByRole('button', { name: 'Crear evento' }))

    expect(await screen.findByText('Ingresa un código de evento.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el nombre del evento.')).toBeInTheDocument()
    expect(peticiones).toBe(0)
  })

  it('navega a la gestión tras crear un evento (201)', async () => {
    const user = userEvent.setup()
    autenticar('ADMIN')
    server.use(
      http.post(`${API}/events`, () =>
        HttpResponse.json(eventoPublicado, { status: 201 }),
      ),
    )
    renderConProveedores(
      [
        { path: '/admin/eventos/nuevo', element: <AdminCrearEvento /> },
        { path: '/admin/eventos/:eventCode', element: <h1>Gestión</h1> },
      ],
      { initialEntries: ['/admin/eventos/nuevo'] },
    )

    await user.type(await screen.findByLabelText('Código del evento'), 'CMF-2026')
    await user.type(screen.getByLabelText('Nombre'), 'Caribbean Music Fest 2026')
    fireEvent.change(screen.getByLabelText('Fecha y hora'), {
      target: { value: '2026-12-12T20:00' },
    })
    await user.selectOptions(screen.getByLabelText('Sede'), 'VEN-SMR-01')
    await user.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(await screen.findByRole('heading', { name: 'Gestión' })).toBeInTheDocument()
  })

  it('muestra los details del 400 junto a los campos', async () => {
    const user = userEvent.setup()
    autenticar('ADMIN')
    server.use(
      http.post(`${API}/events`, () =>
        errorRespuesta(400, 'Datos inválidos', {
          eventCode: 'El código ya existe.',
        }),
      ),
    )
    renderConProveedores(
      [{ path: '/admin/eventos/nuevo', element: <AdminCrearEvento /> }],
      { initialEntries: ['/admin/eventos/nuevo'] },
    )

    await user.type(await screen.findByLabelText('Código del evento'), 'CMF-2026')
    await user.type(screen.getByLabelText('Nombre'), 'Caribbean Music Fest 2026')
    fireEvent.change(screen.getByLabelText('Fecha y hora'), {
      target: { value: '2026-12-12T20:00' },
    })
    await user.selectOptions(screen.getByLabelText('Sede'), 'VEN-SMR-01')
    await user.click(screen.getByRole('button', { name: 'Crear evento' }))

    expect(
      await screen.findByText(/eventCode: El código ya existe\./),
    ).toBeInTheDocument()
  })
})

describe('gestionar evento', () => {
  const montarGestion = () =>
    renderConProveedores(
      [{ path: '/admin/eventos/:eventCode', element: <AdminGestionEvento /> }],
      { initialEntries: ['/admin/eventos/BOR-2026'] },
    )

  it('publica el evento y actualiza el badge', async () => {
    const user = userEvent.setup()
    autenticar('ADMIN')
    let publicado = false
    server.use(
      http.get(`${API}/events/BOR-2026`, () =>
        HttpResponse.json(
          publicado ? { ...eventoBorrador, status: 'PUBLISHED' } : eventoBorrador,
        ),
      ),
      http.patch(`${API}/events/BOR-2026/publish`, () => {
        publicado = true
        return HttpResponse.json({ ...eventoBorrador, status: 'PUBLISHED' })
      }),
    )
    montarGestion()

    await user.click(await screen.findByRole('button', { name: 'Publicar evento' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar publicación' }))

    expect(await screen.findByText('Publicado')).toBeInTheDocument()
  })

  it('muestra el 409 al intentar publicar un evento no publicable', async () => {
    const user = userEvent.setup()
    autenticar('ADMIN')
    server.use(
      http.get(`${API}/events/BOR-2026`, () => HttpResponse.json(eventoBorrador)),
      http.patch(`${API}/events/BOR-2026/publish`, () =>
        errorRespuesta(409, 'El evento no puede publicarse en su estado actual.'),
      ),
    )
    montarGestion()

    await user.click(await screen.findByRole('button', { name: 'Publicar evento' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar publicación' }))

    expect(
      await screen.findByText('El evento no puede publicarse en su estado actual.'),
    ).toBeInTheDocument()
  })

  it('asocia un artista activo y lo muestra en la lista', async () => {
    const user = userEvent.setup()
    autenticar('ADMIN')
    let asociado = false
    server.use(
      http.get(`${API}/events/BOR-2026`, () =>
        HttpResponse.json({
          ...eventoBorrador,
          artists: asociado ? [artistas[0]!] : [],
        }),
      ),
      http.post(`${API}/events/BOR-2026/artists/1`, () => {
        asociado = true
        return HttpResponse.json({ ...eventoBorrador, artists: [artistas[0]!] })
      }),
    )
    montarGestion()

    await user.selectOptions(
      await screen.findByLabelText('Agregar artista'),
      '1',
    )
    await user.click(screen.getByRole('button', { name: 'Asociar artista' }))

    await waitFor(() =>
      expect(screen.getAllByRole('listitem').some((item) => item.textContent === 'Solar Beat')).toBe(true),
    )
    expect(screen.queryByRole('option', { name: 'Solar Beat' })).not.toBeInTheDocument()
  })
})
