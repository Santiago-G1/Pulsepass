import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { RouteObject } from 'react-router'
import { AuthProvider } from '../auth/AuthContext'
import type { Rol } from '../lib/contratos'
import { API, USUARIOS } from './handlers'
import { server } from './server'

export const crearQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })

interface OpcionesRender {
  initialEntries?: (string | { pathname: string; state?: unknown })[]
}

export function renderConProveedores(
  rutas: RouteObject[],
  opciones: OpcionesRender = {},
) {
  const router = createMemoryRouter(rutas, {
    initialEntries: opciones.initialEntries ?? ['/'],
  })
  const queryClient = crearQueryClient()
  const resultado = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return { ...resultado, router, queryClient }
}

export const autenticar = (rol: Rol) => {
  window.sessionStorage.setItem(
    'pulsepass.session',
    JSON.stringify({
      accessToken: 'token-prueba',
      expiresAt: Date.now() + 60_000,
    }),
  )
  server.use(
    http.get(`${API}/auth/me`, () => HttpResponse.json(USUARIOS[rol])),
  )
}
