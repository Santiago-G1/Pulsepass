import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { useParams } from 'react-router'
import { DetalleArtista, ListaArtistas, DetalleSede } from './ArtistasSedes'
import { DetalleEvento } from './Eventos'
import { NoEncontrada } from './Errores'
import { MisTickets } from './Tickets'
import { RutaProtegida } from '../layouts/Guardas'
import {
  API,
  artistas,
  errorRespuesta,
  eventoPublicado,
  sede,
  ticketPagado,
} from '../test/handlers'
import { server } from '../test/server'
import { autenticar, renderConProveedores } from '../test/utils'

function ConfirmacionPrueba() {
  const { ticketCode } = useParams()
  return <h1>Confirmación {ticketCode}</h1>
}

function LoginDesdePrueba() {
  return <h1>Login de origen</h1>
}

describe('compra de tickets', () => {
  it('envía al login a un anónimo que intenta comprar', async () => {
    const user = userEvent.setup()
    renderConProveedores(
      [
        { path: '/eventos/:eventCode', element: <DetalleEvento /> },
        { path: '/login', element: <LoginDesdePrueba /> },
      ],
      { initialEntries: ['/eventos/CMF-2026'] },
    )

    await user.click(await screen.findByRole('button', { name: 'Comprar entrada' }))

    expect(await screen.findByRole('heading', { name: 'Login de origen' })).toBeInTheDocument()
  })

  it('compra con el email de la sesión y navega a la confirmación', async () => {
    const user = userEvent.setup()
    autenticar('USER')
    let cuerpo: unknown
    server.use(
      http.post(`${API}/tickets`, async ({ request }) => {
        cuerpo = await request.json()
        return HttpResponse.json({ ...ticketPagado, ticketCode: 'TKT-NUEVO' }, { status: 201 })
      }),
    )
    renderConProveedores(
      [
        { path: '/eventos/:eventCode', element: <DetalleEvento /> },
        { path: '/compra/confirmacion/:ticketCode', element: <ConfirmacionPrueba /> },
      ],
      { initialEntries: ['/eventos/CMF-2026'] },
    )

    await user.click(await screen.findByRole('button', { name: 'Comprar entrada' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(
      await screen.findByRole('heading', { name: 'Confirmación TKT-NUEVO' }),
    ).toBeInTheDocument()
    expect(cuerpo).toEqual({
      userEmail: 'andrea@pulsepass.test',
      eventCode: 'CMF-2026',
      type: 'GENERAL',
    })
  })

  it('muestra el 409 del backend dentro del modal sin navegar', async () => {
    const user = userEvent.setup()
    autenticar('USER')
    server.use(
      http.post(`${API}/tickets`, () =>
        errorRespuesta(409, 'El evento tiene restricción de edad mínima.'),
      ),
    )
    renderConProveedores(
      [{ path: '/eventos/:eventCode', element: <DetalleEvento /> }],
      { initialEntries: ['/eventos/CMF-2026'] },
    )

    await user.click(await screen.findByRole('button', { name: 'Comprar entrada' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(
      await screen.findByText('El evento tiene restricción de edad mínima.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('artistas y sedes', () => {
  it('lista artistas activos', async () => {
    renderConProveedores([{ path: '/artistas', element: <ListaArtistas /> }], {
      initialEntries: ['/artistas'],
    })

    expect(await screen.findByRole('heading', { name: 'Solar Beat' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Neon Waves' })).toBeInTheDocument()
  })

  it('muestra el detalle de un artista con sus eventos', async () => {
    server.use(
      http.get(`${API}/artists/1`, () => HttpResponse.json(artistas[0])),
      http.get(`${API}/events/by-artist`, () => HttpResponse.json([eventoPublicado])),
    )
    renderConProveedores([{ path: '/artistas/:id', element: <DetalleArtista /> }], {
      initialEntries: ['/artistas/1'],
    })

    expect(await screen.findByRole('heading', { name: 'Solar Beat' })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
  })

  it('presenta la sede y su 404', async () => {
    server.use(
      http.get(`${API}/venues/VEN-SMR-01`, () => HttpResponse.json(sede)),
      http.get(`${API}/venues/NO-EXISTE`, () =>
        errorRespuesta(404, 'Sede no encontrada'),
      ),
    )
    const { unmount } = renderConProveedores(
      [{ path: '/sedes/:code', element: <DetalleSede /> }],
      { initialEntries: ['/sedes/VEN-SMR-01'] },
    )
    expect(await screen.findByRole('heading', { name: 'Marina Convention Center' })).toBeInTheDocument()
    unmount()

    renderConProveedores(
      [{ path: '/sedes/:code', element: <DetalleSede /> }],
      { initialEntries: ['/sedes/NO-EXISTE'] },
    )
    expect(await screen.findByText('Sede no encontrada')).toBeInTheDocument()
  })
})

describe('transversales', () => {
  it('muestra la página 404 en una ruta inexistente', async () => {
    renderConProveedores(
      [
        { path: '/', element: <h1>Inicio</h1> },
        { path: '*', element: <NoEncontrada /> },
      ],
      { initialEntries: ['/no-existe'] },
    )

    expect(
      await screen.findByRole('heading', { name: 'No encontramos esta página.' }),
    ).toBeInTheDocument()
  })

  it('cierra la sesión cuando la API responde 401 y limpia el token', async () => {
    autenticar('USER')
    server.use(
      http.get(`${API}/tickets/by-user`, () =>
        errorRespuesta(401, 'Token expirado'),
      ),
    )
    renderConProveedores([{ path: '/mis-tickets', element: <MisTickets /> }], {
      initialEntries: ['/mis-tickets'],
    })

    await waitFor(() =>
      expect(window.sessionStorage.getItem('pulsepass.session')).toBeNull(),
    )
  })

  it('trata una sesión con token inválido como anónima', async () => {
    window.sessionStorage.setItem(
      'pulsepass.session',
      JSON.stringify({ accessToken: 'token-vencido', expiresAt: Date.now() + 60_000 }),
    )
    server.use(
      http.get(`${API}/auth/me`, () => errorRespuesta(401, 'Token expirado')),
    )
    renderConProveedores(
      [
        { path: '/login', element: <h1>Login</h1> },
        {
          element: <RutaProtegida />,
          children: [{ path: '/cuenta', element: <h1>Mi cuenta</h1> }],
        },
      ],
      { initialEntries: ['/cuenta'] },
    )

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument()
    expect(window.sessionStorage.getItem('pulsepass.session')).toBeNull()
  })
})
