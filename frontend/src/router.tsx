import { createBrowserRouter } from 'react-router'
import { Layout } from './layouts/Layout'
import { RutaPorRol, RutaProtegida, SoloAnonimo } from './layouts/Guardas'
import Inicio from './pages/Inicio'
import { ErrorPagina, NoEncontrada, SinPermisos } from './pages/Errores'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    ErrorBoundary: ErrorPagina,
    children: [
      { index: true, Component: Inicio },
      {
        path: 'eventos',
        lazy: async () => {
          const page = await import('./pages/Eventos')
          return { Component: page.CatalogoEventos }
        },
      },
      {
        path: 'eventos/:eventCode',
        lazy: async () => {
          const page = await import('./pages/Eventos')
          return { Component: page.DetalleEvento }
        },
      },
      {
        path: 'artistas',
        lazy: async () => {
          const page = await import('./pages/ArtistasSedes')
          return { Component: page.ListaArtistas }
        },
      },
      {
        path: 'artistas/:id',
        lazy: async () => {
          const page = await import('./pages/ArtistasSedes')
          return { Component: page.DetalleArtista }
        },
      },
      {
        path: 'sedes',
        lazy: async () => {
          const page = await import('./pages/ArtistasSedes')
          return { Component: page.ListaSedes }
        },
      },
      {
        path: 'sedes/:code',
        lazy: async () => {
          const page = await import('./pages/ArtistasSedes')
          return { Component: page.DetalleSede }
        },
      },
      {
        element: <SoloAnonimo />,
        children: [
          {
            path: 'login',
            lazy: async () => {
              const page = await import('./pages/Auth')
              return { Component: page.Login }
            },
          },
          {
            path: 'registro',
            lazy: async () => {
              const page = await import('./pages/Auth')
              return { Component: page.Registro }
            },
          },
        ],
      },
      { path: '403', Component: SinPermisos },
      { path: '404', Component: NoEncontrada },
      {
        element: <RutaProtegida />,
        children: [
          {
            path: 'cuenta',
            lazy: async () => {
              const page = await import('./pages/Tickets')
              return { Component: page.Cuenta }
            },
          },
          {
            path: 'mis-tickets',
            lazy: async () => {
              const page = await import('./pages/Tickets')
              return { Component: page.MisTickets }
            },
          },
          {
            path: 'mis-tickets/:ticketCode',
            lazy: async () => {
              const page = await import('./pages/Tickets')
              return { Component: page.DetalleTicket }
            },
          },
          {
            path: 'compra/confirmacion/:ticketCode',
            lazy: async () => {
              const page = await import('./pages/Tickets')
              return { Component: page.ConfirmacionCompra }
            },
          },
          {
            element: <RutaPorRol roles={['STAFF', 'ADMIN']} />,
            children: [
              {
                path: 'staff/validacion',
                lazy: async () => {
                  const page = await import('./pages/Operacion')
                  return { Component: page.ValidacionIngreso }
                },
              },
              {
                path: 'staff/eventos/:eventCode/tickets',
                lazy: async () => {
                  const page = await import('./pages/Operacion')
                  return { Component: page.TicketsPagadosEvento }
                },
              },
            ],
          },
          {
            element: <RutaPorRol roles={['ADMIN']} />,
            children: [
              {
                path: 'admin/eventos',
                lazy: async () => {
                  const page = await import('./pages/Administracion')
                  return { Component: page.AdminEventos }
                },
              },
              {
                path: 'admin/eventos/nuevo',
                lazy: async () => {
                  const page = await import('./pages/Administracion')
                  return { Component: page.AdminCrearEvento }
                },
              },
              {
                path: 'admin/eventos/:eventCode',
                lazy: async () => {
                  const page = await import('./pages/Administracion')
                  return { Component: page.AdminGestionEvento }
                },
              },
            ],
          },
        ],
      },
      {
        path: '*',
        Component: NoEncontrada,
      },
    ],
  },
])
