import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { CatalogoEventos, DetalleEvento } from './Eventos'
import { API, errorRespuesta, eventoPublicado } from '../test/handlers'
import { server } from '../test/server'
import { renderConProveedores } from '../test/utils'

describe('cartelera', () => {
  it('lista los eventos publicados sin exigir sesión', async () => {
    renderConProveedores([{ path: '/eventos', element: <CatalogoEventos /> }], {
      initialEntries: ['/eventos'],
    })

    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cartelera' })).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay eventos', async () => {
    server.use(
      http.get(`${API}/events/published`, () => HttpResponse.json([])),
    )
    renderConProveedores([{ path: '/eventos', element: <CatalogoEventos /> }], {
      initialEntries: ['/eventos'],
    })

    expect(await screen.findByText('Sin resultados para tu búsqueda')).toBeInTheDocument()
  })

  it('guarda el filtro de texto y categoría en la URL', async () => {
    const user = userEvent.setup()
    const { router } = renderConProveedores(
      [{ path: '/eventos', element: <CatalogoEventos /> }],
      { initialEntries: ['/eventos'] },
    )

    await user.type(await screen.findByLabelText('Buscar por nombre'), 'caribbean')
    await waitFor(() =>
      expect(router.state.location.search).toContain('q=caribbean'),
    )

    await user.selectOptions(screen.getByLabelText('Categoría'), 'MUSIC')
    await waitFor(() =>
      expect(router.state.location.search).toContain('categoria=MUSIC'),
    )
    expect(router.state.location.search).toContain('q=caribbean')
  })
})

describe('detalle de evento', () => {
  it('muestra datos, sede y artistas del evento publicado', async () => {
    renderConProveedores(
      [{ path: '/eventos/:eventCode', element: <DetalleEvento /> }],
      { initialEntries: ['/eventos/CMF-2026'] },
    )

    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Marina Convention Center')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Solar Beat' })).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
  })

  it('presenta "Evento no disponible" ante un 404 sin exponer datos', async () => {
    server.use(
      http.get(`${API}/events/NO-EXISTE`, () =>
        errorRespuesta(404, 'Evento no encontrado'),
      ),
    )
    renderConProveedores(
      [{ path: '/eventos/:eventCode', element: <DetalleEvento /> }],
      { initialEntries: ['/eventos/NO-EXISTE'] },
    )

    expect(await screen.findByText('Evento no disponible')).toBeInTheDocument()
  })

  it('deshabilita la compra cuando el evento está agotado', async () => {
    server.use(
      http.get(`${API}/events/CMF-2026`, () =>
        HttpResponse.json({ ...eventoPublicado, status: 'SOLD_OUT' }),
      ),
    )
    renderConProveedores(
      [{ path: '/eventos/:eventCode', element: <DetalleEvento /> }],
      { initialEntries: ['/eventos/CMF-2026'] },
    )

    const boton = await screen.findByRole('button', { name: 'Compra no disponible' })
    expect(boton).toBeDisabled()
  })
})
